'use strict';

const poolModule = require('generic-pool');
const fork = require('child_process').fork;
const connections = require('./sqlanywhere/connectionParams');
const _ = require('lodash');

module.exports = function (name) {

    class Pool {

        constructor(config) {
            this.config = _.clone(config);
            this.counter = 0;
        }

        createPool() {
            let self = this;
            let pool = poolModule.Pool({

                name: this.config.name,
                create: function (callback) {

                    var conn = {

                        process: fork('server/sqlAnywhere/sqlAnywhereConnect', [self.config.params]),
                        number: self.counter++,
                        requestCount: 0,

                        exec: function (sql, callback) {
                            conn.callback = callback;
                            conn.process.send({
                                number: ++conn.requestCount,
                                sql: sql.toString()
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

            return pool;
        }
    }

    let pools = {};
    _.each(connections, function (o) {
        pools[o.name] = new Pool(o).createPool();
    });

    return pools[name];
};
