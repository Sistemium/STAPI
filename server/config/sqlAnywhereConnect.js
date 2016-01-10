"use strict";

require('epipebomb')();

var sqlanywhere = require('sqlanywhere');
var connParams = process.argv[2];
var conn = sqlanywhere.createConnection();
var connectedAt;

var parseError = function (saError) {
    var err = saError.toString();
    //console.log (saError);
    try {
        return {
            code: err.match(/Code: ([^ ]*)/)[1],
            text: err.match(/Msg: (.*)/)[1]
        }
    } catch (e) {
        return {
            code: '',
            text: err
        }
    }
};

conn.connect(connParams, function(err) {
    if (err) {
        process.send({connectError: parseError(err)});
    } else {
        connectedAt = new Date ();
        process.send('connected');
    }
});

process.on('message', function(m) {

    if (m.sql) {
        conn.exec(m.sql, function(err,res){
            if (err) {
                m.error = parseError(err);
                process.send(m);
            } else {
                conn.commit(function(err){
                    if (err) {
                        m.error = parseError(err);
                    } else {
                        m.result = res;
                    }
                    process.send(m);
                });
            }
        })
    } else if (m === 'rollback') {
        conn.rollback(function(err){
            if (err) {
                m = {error: parseError(err)}
            } else {
                m = 'rolled back'
            }
            process.send(m);
        })
    }

});

var killer = function() {
    console.log ('Killer sqlanywhere');
    if (connectedAt) {
        conn.disconnect(function(){
            process.exit();
        });
    } else {
        process.exit();
    }
};

process.on('disconnect', killer);

process.on('SIGINT', killer);
process.on('SIGTERM', killer);
