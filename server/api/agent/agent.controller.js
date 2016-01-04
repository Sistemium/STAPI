"use strict";

var sqlanywhere = require('sqlanywhere');
var config = require('./../../domain/agent');
var orm = require('../../orm/orm');
var _ = require('lodash');

var conn = sqlanywhere.createConnection();
var connParams = config.connectionParams;

export function index (req, res, next) {
    conn.connect(connParams, function (err) {
        if (err) {
            conn.disconnect();
            next(err);
        }
        console.log('Connect success');
        let query = orm.query(config);
        console.log(query);
        conn.exec(query, function (err, result) {
            if (err) {
                conn.disconnect();
                return next(err);
            }
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
        if (err) next(err);
        console.log('Connect success');
        let fields = Object.keys(req.body).join(', ');
        let values = _.values(req.body).join(', ');
        conn.exec(`INSERT INTO ${config.tableName} (${fields}) VALUES (${values})`, function (err, result) {
            if (err) next(err);
            conn.disconnect();
            console.log(result);

            return res.status(204);
        })
    })
}
//
//export function put(req, res, next) {
//    console.log('put');
//    conn.connect(connParams, function (err) {
//        if (err) next (err);
//        console.log('Connect success');
//        let condition = req.params['condition'];
//        let setExpr = [];
//        _.each(req.body, (n, key) => {
//            setExpr.push(`${key} = ${n}`);
//        });
//        setExpr = setExpr.join(', ');
//
//        conn.exec(`UPDATE ${config.tableName} SET ${setExpr} WHERE ${condition}`, function (err, result) {
//            if (err) next(err);
//            conn.disconnect();
//            return res.status(203);
//        })
//
//    })
//}
