"use strict";

var config = require('./../../domain/agent');
var orm = require('../../orm/orm');
var _ = require('lodash');
var pool = require('../../config/pooling');

var errorHandler = function (err,conn,next) {

    console.error('Client:', conn.number, 'exec error:', err);

    if (err.code.match(/(-308)(-2005)|/ig)) {
        console.log('Pool will destroy conn:', conn.number);
        pool.destroy(conn);
    } else {
        conn.busy = false;
        conn.rollback(function () {
            pool.release(conn);
        });
    }

    return next(new Error(err));

};

export function index(req, res, next) {

    pool.acquire(function (err,conn) {

        conn.busy = true;

        if (err) {
            console.log('acquire err:', err);
            return res.status(500).end(err.text);
        }

        req.on('close', function() {
            console.error ('Client:', conn.number, 'request closed unexpectedly');
            conn.rejectExec()
        });

        console.log (_.assign({},req.params,req.query));

        let query = orm.query(config,_.assign({},req.params,req.query));
        console.log('Client:', conn.number, 'request:', query);

        conn.exec(query, function (err, result) {

            if (err) {
                return errorHandler(err,conn,next);
            }

            conn.busy = false;
            pool.release(conn);

            if (req.params.id) {
                result = result.length ? result [0] : undefined;
            }

            if (!result) {
                return res.status(404).json();
            } else if (req.params.id || result.length) {
                return res.status(200).json(result);
            } else {
                return res.status(204).json();
            }

        });

    });
}

export function post(req, res, next) {

    if (_.isEmpty(req.body)) {
        return res.status(400) && next('Empty body');
    }

    pool.acquire(function (err,conn) {

        if (err) {
            console.log('acquire err:', err);
            return res.status(500).end(err.text);
        }

        req.on('close', function() {
            console.error ('Client:', conn.number, 'request closed unexpectedly');
            conn.rejectExec()
        });

        let query = orm.insert(req.body, config);
        console.log('Client:', conn.number, 'query:', query);

        conn.exec(query, function (err, rowsAffected) {

            if (err) {
               return errorHandler(err,conn,next);
            }

            pool.release(conn);

            if (rowsAffected) {
                return res.status(200).set('Rows-Affected',rowsAffected).end();
            } else {
                return res.status(404).end();
            }

        });
    });
}
