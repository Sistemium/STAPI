require('epipebomb')();

var sqlanywhere = require('sqlanywhere');
var connParams = process.argv[2];
var conn = sqlanywhere.createConnection();
var connectedAt;

conn.connect(connParams, function(err) {
    if (err) {
        process.send({connectError: err.toString()});
    } else {
        connectedAt = new Date ();
        process.send('connected');
    }
});

process.on('message', function(m) {

    if (m.sql) {
        conn.exec(m.sql, function(err,res){
            if (err) {
                m.error = err.toString()
                process.send(m);
            } else {
                conn.commit(function(){
                    m.result = res;
                    process.send(m);
                });
            }
        });
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
