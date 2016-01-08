var poolModule = require('generic-pool');
var sqlanywhere = require('sqlanywhere');
var connParams =require('./sqlanywhere/connectionParams').connectionParams.phatest;
var i = 0;

var pool = poolModule.Pool({

    name: 'phatest',
    create: function(callback) {
        var sa = sqlanywhere.createConnection();

        var c = {
            sa: sa,
            number: i++
        };

        sa.connect(connParams, function(err) {
            callback(err, c)
        });

    },

    destroy: function(client) {
        client.sa && client.sa.disconnect();
    },

    max: 3,
    min: 2,
    refreshIdle: true,
    idleTimeoutMillis: 30000,
    log: function (str,level) {
        if (level != 'verbose') {
            console.log (str);
        }
    }

});

module.exports = pool;

var killer = function() {
    pool.drain(function() {
        pool.destroyAllNow();
    });
    process.exit();
};

process.on('SIGINT', killer);
process.on('SIGTERM', killer);
//process.on('SIGKILL', killer);
