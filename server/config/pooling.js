var poolModule = require('generic-pool');
var fork = require('child_process').fork;
var connParams = require('./sqlanywhere/connectionParams').connectionParams.phatest;

var i = 0;

var pool = poolModule.Pool({

    name: 'phatest',
    create: function(callback) {

        var sa = {
            process: fork('server/config/sqlAnywhereConnect',[connParams]),
            number: i++,
            requestCount: 0,
            exec: function (sql,callback) {
                sa.callback = callback;
                sa.process.send({
                    number: ++ sa.requestCount,
                    sql: sql.toString()
                });
            },
            rejectExec: function () {
                sa.callback = function () {
                    sa.busy = false;
                    pool.release(sa);
                };
            }
        };

        sa.process.on('message', function(m) {
            if (m === 'connected') {
                callback (null, sa);
            } else if (m.connectError) {
                sa.busy = true;
                callback (m.connectError, sa);
                sa.process.kill ();
            } else if (m.result) {
                if (m.number == sa.requestCount) {
                    if (sa.callback) {
                        sa.callback (null,m.result);
                    } else {
                        console.error ('Client', sa.number, 'empty callback');
                    }
                } else {
                    console.error ('Client', sa.number, 'wrong result message number');
                }
            } else if (m.error) {
                sa.callback (m.error);
            }
        });

        sa.process.on('error',function(){
            console.log ('Client error:', sa.number);
        });

    },

    validate: function (client) {
        if (client.busy) {
            console.error ('Client busy:', client.number);
        }
        return !client.busy;
    },

    destroy: function(client) {
        console.log ('Pool destroy client:', client.number);
        if (client.process) {
            client.process.disconnect();
        }
    },

    max: 10,
    min: 2,
    refreshIdle: true,
    idleTimeoutMillis: 60000,
    log: function (str,level) {
        if (level != 'verbose') {
            console.log ('Pool', level+':', str);
        }
    }

});

module.exports = pool;

var killer = function() {
    console.log ('Killer start');
    pool.drain(function() {
        pool.destroyAllNow();
        process.exit();
    });
};

process.on('SIGINT', killer);
process.on('SIGTERM', killer);
//process.on('SIGKILL', killer);
