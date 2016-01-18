'use strict';
const poolModule = require('generic-pool');
const fork = require('child_process').fork;
const _ = require('lodash');


class Pool {

    constructor(config) {
        this.config = config;
        this.counter = 0;
    }

    createPool() {
        let self = this;
        let pool = poolModule.Pool({

            name: self.config.name,
            create: function (onCreateCallback) {

                var conn = {

                    process: fork('server/sqlAnywhere/sqlAnywhereConnect', [self.config.params]),
                    number: self.counter++,
                    requestCount: 0,

                    exec: function (sql, params, callback) {

                        var _params = params;

                        if (typeof params === 'function') {
                            conn.callback = params;
                            _params = undefined;
                        } else {
                            conn.callback = callback;
                        }

                        conn.process.send({
                            number: ++conn.requestCount,
                            sql: sql.toString(),
                            params: _params
                        });
                    },

                    rollback: function (callback) {
                        conn.callback = callback;
                        conn.process.send('rollback');
                    },

                    rejectExec: function () {
                        conn.callback = function () {
                            conn.busy = false;
                            pool.release(conn);
                        };
                    }
                };

                conn.process.on('message', function (m) {
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
                    } else if (m.result) {
                        if (m.number == conn.requestCount) {
                            if (conn.callback) {
                                conn.callback(null, m.result);
                            } else {
                                console.error('Client', conn.number, 'empty callback');
                            }
                        } else {
                            console.error('Client', conn.number, 'wrong result message number');
                        }
                    } else if (m.error) {
                        conn.callback(m.error);
                    } else if (m === 'rolled back') {
                        conn.callback();
                    }
                });

                conn.process.on('error', function () {
                    console.log('Client error:', conn.number);
                });

            },

            validate: function (client) {
                if (client.busy) {
                    console.error('Client busy:', client.number);
                }
                return !client.busy;
            },

            destroy: function (client) {
                console.log('Pool destroy client:', client.number);
                if (client.process) {
                    client.process.disconnect();
                }
            },

            max: this.config.max || 10,
            min: this.config.min || 2,
            refreshIdle: this.config.refreshIdle || true,
            idleTimeoutMillis: this.config.idleTimeoutMillis || 60000,
            log: function (str, level) {
                if (level != 'verbose') {
                    console.log('Pool', pool.getName(), level + ':', str);
                }
            }
        });

        var poolAcquire = pool.acquire;


        pool.acquirePromise = function () {
            return new Promise(function (resolve, reject) {
                poolAcquire(function (err, conn) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(conn);
                    }
                });
            });
        };

        pool.customAcquire = function () {
            var args = arguments;
            return new Promise(function (resolve, reject) {
                pool.acquirePromise().then(function (conn) {
                    if (pool.config.onAcquire) {
                        pool.config.onAcquire.apply(conn, args)
                            .then(function () {
                                resolve(conn);
                            }, reject);
                    } else {
                        resolve(conn);
                    }
                }, reject);
            });
        };

        pool.config = self.config;


        return pool;
    }
}

export default Pool;
