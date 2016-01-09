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

    pool.acquire(function (err,conn) {

        conn.busy = true;

        if (err) {
            console.log('acquire err:', err);
            return res.status(500).end(err);
        }

        req.on('close', function() {
            console.error ('Client:', conn.number, 'request closed unexpectedly');
            conn.rejectExec()
        });

        let query = orm.query(config);
        console.log('Client:', conn.number, 'request:' /*, query*/);

        conn.exec(query, function (err, result) {

            if (err) {
                console.error('exec err:',err);
                if (err.match(/(Connection was terminated)|(Not connected to a database)/ig)) {
                    console.log('Pool will destroy conn:', conn.number);
                    pool.destroy(conn);
                } else {
                    conn.busy = false;
                    conn.rollback(function () {
                        pool.release(conn);
                    });
                }
                return res.status(500).end(err);
            }

            conn.busy = false;
            pool.release(conn);

            if (result) {
                return res.status(200).json(result);
            } else {
                return res.status(404);
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
