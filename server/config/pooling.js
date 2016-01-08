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
            sa: {
                exec: function (sql,callback) {
                    sa.callback = callback;
                    sa.process.send({sql: sql.toString()});
                }
            }
        };

        sa.process.on('message', function(m) {
            if (m === 'connected') {
                callback (null, sa);
            } else if (m.connectError) {
                callback (m.connectError);
                sa.process.kill ();
            } else if (m.result) {
                sa.callback (null,m.result);
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
        client.process.disconnect();
    },

    max: 10,
    min: 2,
    refreshIdle: true,
    idleTimeoutMillis: 60000,
    log: function (str,level) {
        if (level != 'verbose') {
            console.log (str);
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
