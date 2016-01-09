require('epipebomb')();

var sqlanywhere = require('sqlanywhere');
var connParams = process.argv[2];
var conn = sqlanywhere.createConnection();


conn.connect(connParams, function(err) {
    if (err) {
        process.send({connectError: err.toString()});
    } else {
        process.send('connected');
    }
});

process.on('message', function(m) {
    if (m.sql) {
        conn.exec(m.sql, function(err,res){
            if (err) {
                process.send({error: err.toString()});
            } else {
                conn.commit(function(){
                    process.send({result: res});
                });
            }
        });
    }
    if (m === 'disconnect') {
        conn.disconnect(q.callback);
    }
});

var killer = function() {
    console.log ('Killer sqlanywhere');
    conn.disconnect(function(){
        process.exit();
    });
};

process.on('disconnect', killer);

process.on('SIGINT', killer);
process.on('SIGTERM', killer);
