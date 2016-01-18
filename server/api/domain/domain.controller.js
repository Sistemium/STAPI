"use strict";
var orm = require('../../orm/orm');
var _ = require('lodash');
var pools = require('../../pool');

var errorHandler = function (err,conn, pool, res) {

    console.error('Client:', conn.number, 'exec error:', err);

    if (err.code.match(/(-308)(-2005)/ig)) {
        console.log('Pool will destroy conn:', conn.number);
        pool.destroy(conn);
    } else {
        conn.busy = false;
        conn.rollback(function () {
            pool.release(conn);
        });
    }

    return res.status(500).json(err);
};


var doSelect = function (pool, conn, req, res) {

    if (req.method === 'HEAD') {
        req['x-params']['agg:'] = true;
    }

    let query = orm.select(req.app.locals.domain, req['x-params'], req.app.locals.domainConfig, req.pool);
    console.log('Client:', conn.number, 'request:', query);

    conn.exec(query.query, query.params, function (err, result) {

        if (err) {
            return errorHandler(err, conn, pool, res);
        }

        conn.busy = false;
        pool.release(conn);

        if (req.params.id) {
            result = result.length ? result [0] : undefined;
        }

        if (!result) {
            return res.status(404).json();
        } else if (req.params.id || result.length) {
            if (req.method === 'HEAD') {
                res.set('X-Aggregate-Count', result[0].cnt);
                return res.status(200).end();
            } else if (result.length) {
                res.set('X-Rows-Count', result.length);
            }
            return res.status(200).json(result);
        } else {
            return res.status(204).json();
        }

    });
};

export function index(req, res) {

    var pool = pools(req.pool);

    pool.acquire(function (err,conn,auth) {

        if (err) {
            console.log('acquire err:', err);
            return res.status(err === 'not authorized' ? 401 : 500).end(err.text);
        }

        req.on('close', function() {
            console.error ('Client:', conn.number, 'request closed unexpectedly');
            conn.rejectExec();
        });

        console.log ('Conn', conn.number, 'auth:', auth);

        doSelect (pool, conn, req, res);

    },req.headers.authorization);
}

export function post(req, res, next) {
    var pool = pools(req.pool);

    if (_.isEmpty(req.body)) {
        return res.status(400) && next('Empty body');
    }

    pool.acquire(function (err,conn,auth) {

        if (err) {
            console.log('acquire err:', err);
            return res.status(err === 'not authorized' ? 401 : 500).end(err.text);
        }

        req.on('close', function() {
            console.error ('Client:', conn.number, 'request closed unexpectedly');
            conn.rejectExec()
        });

        console.log (req.body);

        req.body.author = auth.id;

        let query = orm.insert(req.body, req.app.locals.domain, req.app.locals.domainConfig, req.pool);
        console.log('Client:', conn.number, 'query:', query.query, 'params:', query.params);

        conn.exec(query.query, query.params, function (err, rowsAffected) {

            if (err) {
               return errorHandler(err,conn, pool, res);
            }

            pool.release(conn);

            if (rowsAffected) {
                return res.status(200).set('X-Rows-Affected',rowsAffected).end();
            } else {
                return res.status(404).end();
            }

        });
    },req.headers.authorization);
}
