'use strict';

import config from '../config/environment';
const authUrl = config.stAuthUrl;
const request = require('request');
const pools = require('../pool/poolManager');

// переделать на хранение в redis с автоочисткой по expiresAt
var authorizedTokens = {};
var badTokens = {};

var authByToken = function (token) {

    var options = {
        url: authUrl,
        headers: {
            authorization: token
        }
    };

    return new Promise (function (resolve,reject) {

        request.get(options,function(err,res,body){

            var jsonBody;

            try {
                jsonBody = JSON.parse(body);
            } catch (x) {
                jsonBody = false;
            }

            if (!err && res.statusCode == 200 && jsonBody) {
                resolve (jsonBody);
            } else {
                reject (res.statusCode || err);
            }

        });

    });

};

var checkOrgAuth = function (org,auth) {

    try {
        if (auth.account.org === org || auth.roles.admin) {
            return true;
        }
    } catch (e) {
        return false;
    }

    return false;

};

export default function () {

    if (!authUrl) {
        return function (req, res, next) {
            next();
        }
    }

    return function (req, res, next) {

        var checkRoles = function (auth) {

            if (checkOrgAuth(req.pool,auth)) {
                req.auth = auth;
                console.log('checkOrgAuth');
                authDb(req,res,next);
            } else {
                res.status(403).end();
            }

        };

        var token = req.headers.authorization;

        if (!token || badTokens[token]) {
            res.status(401).end();
        } else if (authorizedTokens[token]) {
            checkRoles(authorizedTokens[token]);
        } else {
            authByToken(token).then(function (res) {
                console.log ('Auth account success:', res.account);
                checkRoles (authorizedTokens[token] = res);
            },function (){
                badTokens[token] = true;
                res.status(401).end();
            });
        }
    };

    function authenticator (conn, token) {
        return function (resolve, reject) {

            var sql = `select * from uac.authorizedAccount ('${token}')`;

            conn.exec (sql,function(err,res){
                if (err || !res.length) {
                    reject (err || 'not authorized');
                } else {
                    resolve (res[0]);
                }
            });

        };
    }

    function authDb (req, res, next) {
        console.log('authDb start');
        let token = req.headers.authorization;

        let pool = pools.getPoolByName(req.pool);

        let authMap = (pool.authMap = pool.authMap || new Map());

        let auth = authMap.get(token);

        if (auth) {
            next();
        } else {
            doAuth(pool,token).then (function(authData){
                authMap.set(token,authData);
                next();
            },function(err){
                res.status(401).end(err);
            });
        }
    }

    function doAuth (pool,token) {
        return new Promise(function(resolve,reject){
            pool.acquirePromise().then(function (conn) {

                let p = new Promise(authenticator(conn,token));

                p.then(function (authData) {
                        pool.release(conn);
                        resolve(authData);
                    },
                    function (err) {
                        pool.release(conn);
                        reject(err);
                    }
                );

            },reject);
        });

    }
}
