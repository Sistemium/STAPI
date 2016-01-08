"use strict";

var config = require('./../../domain/agent');
var orm = require('../../orm/orm');
var _ = require('lodash');
var pool = require('../../config/pooling');

var errorHandler = function (err,conn,next) {
    if (err) {
        conn.disconnect();
        return next(err);
    }
};

export function index(req, res, next) {

    pool.acquire(function (err,client) {

        client.busy = true;

        var conn = client.sa;

        if (err) {
            console.log('acquire err:', err);
            return res.end(err);
        }

        req.on('close', function() {
            console.error ('Client:', client.number, 'request closed unexpectedly');
        });

        let query = orm.query(config);
        console.log('Client:', client.number, 'request:' /*, query*/);

        conn.exec(query, function (err, result) {

            try {

                if (err) {
                    console.error('exec err:',err);
                    if (err.match(/(Connection was terminated)|(Not connected to a database)/ig)) {
                        console.log('Pool will destroy client:', client.number);
                        client.toDestroy = true;
                        pool.destroy(client);
                    } else {
                        client.busy = false;
                        conn.rollback(function () {
                            pool.release(client);
                        });
                    }
                    return res.end(err);
                }

                client.busy = false;
                pool.release(client);

                if (result) {
                    return res.status(200).json(result);
                } else {
                    return res.status(404);
                }


            } catch (e) {
                console.error ('catch:', e);
                return res.end(e.toString());
            }
        });

    });
}

export function post(req, res, next) {
    //conn.connect(connParams, function (err) {
    //    errorHandler(err, conn, next);
    //    console.log('Connect success');
    //    if (_.isEmpty(req.body)) {
    //        conn.disconnect();
    //        return next(new Error('Empty body'));
    //    }
    //    let query = orm.insert(req.body, config);
    //    console.log(query);
    //    conn.exec(query, function (err, affected) {
    //        errorHandler(err, conn, next);
    //        conn.commit(function (err) {
    //            errorHandler(err, conn, next);
    //            console.log('Committed', affected);
    //            conn.disconnect();
    //            return res.status(204).send('smt');
    //        });
    //    });
    //});
}
