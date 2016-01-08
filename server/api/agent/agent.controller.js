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
    console.log('acquire:');
    pool.acquire(function (err,client) {

        var conn = client.sa;

        if (err) {
            console.log('acquire err:', err);
            return res.end(err);
        }

        req.on("close", function() {
            try {
                console.log ('request closed unexpectedly');
                pool.release(client);
            } catch (e) {
                console.log ('Req.close catch:', e);
            }
        });

        req.on("end", function() {
            try {
                console.log ('request end');
                pool.release(client);
            } catch (e) {
                console.log ('Req.end catch:', e);
            }
        });

        let query = orm.query(config);
        console.log(client.number, query);

        conn.exec(query, function (err, result) {

            try {

                if (err) {
                    console.log('exec err:', err);
                    //pool.release(client);
                    //conn.rollback(function () {
                    //
                    //});
                    return res.end(err);
                }

                conn.commit(function () {
                    //try {
                    //    pool.release(client);
                    //} catch (e) {
                    //    console.log ('Commit catch:', e);
                    //}
                    if (result) {
                        return res.status(200).json(result);
                    } else {
                        return res.status(404);
                    }
                });
            } catch (e) {
                console.log ('catch:', e);
                pool.release(client);
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
