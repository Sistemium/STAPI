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

            name: this.config.name,
            create: function (callback) {

                var connAuth = {};

                var authenticator = function (conn, token) {
                    return function (resolve, reject) {

                        if (connAuth[token]) {
                            resolve(connAuth[token]);
                        } else {
                            var sql = `select * from uac.authorizedAccount ('${token}')`;

                            conn.exec (sql,function(err,res){
                                if (err || !res.length) {
                                    reject (err || 'not authorized');
                                } else {
                                    resolve (connAuth[token] = res[0]);
                                }
                            });
                        }

                    };
                };

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
                    },

                    authData: function (token) {
                        return connAuth [token];
                    },

                    authorize: function (token) {
                        return new Promise (authenticator(conn,token));
                    }
                };

                conn.process.on('message', function (m) {
                    if (m === 'connected') {
                        callback(null, conn);
                    } else if (m.connectError) {
                        conn.busy = true;
                        callback(m.connectError, conn);
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

        pool.acquire = function (callback, token) {
            poolAcquire (function (err,acquiredConn){
                if (!err && token) {

                    var connAuthData = acquiredConn.authData(token);

                    if (acquiredConn.authData(token)) {
                        callback (err, acquiredConn, connAuthData);
                    } else {
                        acquiredConn.authorize(token).then(
                            function (connAuthData) {
                                callback(err, acquiredConn, connAuthData);
                            },
                            function (err) {
                                pool.release(acquiredConn);
                                callback (err);
                            }
                        );
                    }

                } else {
                    callback (err, acquiredConn);
                }
            });
        };

        return pool;
    }
}

export default Pool;
