'use strict';
const debug = require('debug')('stapi:pool');
const poolModule = require('generic-pool');
const fork = require('child_process').fork;
const _ = require('lodash');

const sqlAnywhereConnect = 'server/components/sqlAnywhere/sqlAnywhereConnect';

class Pool {

  constructor(config) {
    this.config = config;
    this.counter = 0;
  }

  createPool() {

    const self = this;

    const pool = poolModule.Pool({

      name: this.config.name,
      max: this.config.max || 10,
      min: this.config.min || 2,
      refreshIdle: this.config.refreshIdle || true,
      idleTimeoutMillis: this.config.idleTimeoutMillis || 60000,

      create,
      validate,
      destroy,
      log

    });

    let originalRelease = pool.release;

    if (self.config.maxRequestCount) {
      pool.release = releaseWrap;
    }

    return _.assign(pool, {

      config: this.config,

      acquirePromise,
      customAcquire

    });

    /*
    Functions
     */

    function releaseWrap(item) {

      if (item.requestCount > self.config.maxRequestCount) {
        debug('destroy by maxCount', item.name);
        return pool.destroy(item);
      }

      debug('requestCount', item.requestCount, item.name);

      originalRelease.call(pool, item);

    }

    function log(str, level) {
      if (level !== 'verbose') {
        debug(level + ' pool: ' + pool.getName(), str);
      }
    }

    function destroy(client) {
      debug('destroy', 'client number:', client.name);
      if (client.process) {
        client.process.disconnect();
      }
    }

    function validate(client) {
      if (client.busy) {
        console.error('Client busy:', client.name);
      }
      return !client.busy;
    }

    function acquirePromise() {

      return new Promise((resolve, reject) => {

        pool.acquire((err, aConn) => {
          if (err) {
            reject(err)
          } else {
            resolve(aConn);
          }
        });

      });

    }

    function customAcquire() {

      let args = arguments;

      return new Promise((resolve, reject) => {

        pool.acquirePromise()
          .then(aConn => {

            if (!pool.config.onAcquire) {
              return resolve(aConn);
            }

            pool.config.onAcquire.apply(aConn, args)
              .then(() => resolve(aConn))
              .catch(err => {

                if (err.code && err.code.match(/(-308)|(-2005)|(-121)|(-101)/ig)) {
                  pool.destroy(aConn);
                } else {
                  pool.release(aConn);
                }

                debug('onAcquire', 'reject:', err);
                reject(err);

              });

          })
          .catch(reject);

      });

    }

    function create(onCreateCallback) {

      let connName = `${self.config.name}-${++self.counter}`;

      let conn = {

        process: fork(sqlAnywhereConnect, [self.config.params, connName]),
        number: self.counter,
        name: connName,
        requestCount: 0,

        exec: function (sql, params, callback, autoCommit = true) {

          let _params = params;

          if (typeof params === 'function') {
            conn.callback = params;
            _params = undefined;
          } else {
            conn.callback = callback;
          }

          conn.process.send({
            number: ++conn.requestCount,
            sql: sql.toString(),
            params: _params,
            autoCommit: autoCommit
          });

        },

        rollback: function (callback) {
          conn.callback = callback;
          conn.process.send('rollback');
        },

        execWithoutCommit: function (sql, params, callback) {
          conn.exec(sql, params, callback, false);
        },

        commit: function (callback) {
          conn.callback = callback;
          conn.process.send('commit');
        },

        rejectExec: function () {
          conn.callback = () => {
            conn.rollback(() => {
              conn.busy = false;
              pool.release(conn);
            })
          };
        }
      };

      conn.process.on('message', function (m) {
        //debug ('message', m);
        if (m === 'connected') {
          if (self.config.onConnect) {
            self.config.onConnect.apply(conn).then(function () {
              onCreateCallback(null, conn);
            }, function (err) {
              onCreateCallback(err);
            })
          } else {
            onCreateCallback(null, conn);
          }
        } else if (m.connectError) {
          conn.busy = true;
          onCreateCallback(m.connectError, conn);
          conn.process.kill();
        } else if (m.result || m.result === 0) {
          if (m.number == conn.requestCount) {
            if (conn.callback) {
              conn.callback(null, m.result);
            } else {
              console.error('Client', conn.name, 'empty callback');
            }
          } else {
            console.error('Client', conn.name, 'wrong result message number');
          }
        } else if (m.error) {
          conn.callback(m.error);
        } else if (m === 'rolled back' || m === 'committed') {
          conn.callback();
        }
      });

      conn.process.on('error', function () {
        console.error('Client error:', conn.name);
      });

    }

  }
}

export default Pool;
