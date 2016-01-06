"use strict";

var sqlanywhere = require('sqlanywhere');
var config = require('./../../domain/agent');
var orm = require('../../orm/orm');
var _ = require('lodash');

var conn = sqlanywhere.createConnection();
var connParams = config.connectionParams;


var errorHandler = function (err,conn,next) {
    if (err) {
        conn.disconnect();
        return next(err);
    }
};

export function index(req, res, next) {
    conn.connect(connParams, function (err) {
        errorHandler(err, conn, next);
        console.log('Connect success');
        let query = orm.query(config);
        console.log(query);
        conn.exec(query, function (err, result) {
            errorHandler(err, conn, next);
            conn.disconnect();
            if (result) {
                return res.status(200).json(result);
            }
            else {
                return res.status(404);
            }
        });
    });
}

export function post(req, res, next) {
    conn.connect(connParams, function (err) {
        errorHandler(err, conn, next);
        console.log('Connect success');
        if (_.isEmpty(req.body)) {
            conn.disconnect();
            return next(new Error('Empty body'));
        }
        let query = orm.insert(req.body, config);
        console.log(query);
        conn.exec(query, function (err, affected) {
            errorHandler(err, conn, next);
            conn.commit(function (err) {
                errorHandler(err, conn, next);
                console.log('Committed', affected);
                conn.disconnect();
                return res.status(204).send('smt');
            });
        });
    });
}
