'use strict';

const pools = require('../../pool/poolManager');

export function dbAuth() {
    return function (req, res, next) {
        authDb(req, res, next);
    }
}

export function onConnect() {
    var conn = this;
    return new Promise(function (resolve, reject) {
        conn.exec('create variable @@UACToken string', function (err, res) {
            console.error(err, res);
            if (!err) {
                console.log('@@UACToken create success');
                resolve(conn);
            } else {
                console.error(err);
                reject(err);
            }
        });
    });
}

export function onAcquire(token) {
    var conn = this;
    return new Promise(function (resolve, reject) {
        conn.exec(`set @@UACToken = '${token}'`, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(conn);
            }
        });
    });
}

function authenticator(conn, token) {
    return function (resolve, reject) {

        var sql = `select * from uac.authorizedAccount ('${token}')`;

        conn.exec(sql, function (err, res) {
            if (err || !res.length) {
                reject(err || 'not authorized');
            } else {
                resolve(res[0]);
            }
        });

    };
}

function authDb(req, res, next) {
    console.log('authDb start');
    let token = req.headers.authorization;

    let pool = pools.getPoolByName(req.pool);

    let authMap = (pool.authMap = pool.authMap || new Map());

    let auth = authMap.get(token);

    if (auth) {
        next();
    } else {
        doAuth(pool, token).then(function (authData) {
            authMap.set(token, authData);
            next();
        }, function (err) {
            res.status(401).end(err);
        });
    }
}

function doAuth(pool, token) {
    return new Promise(function (resolve, reject) {
        pool.acquirePromise().then(function (conn) {

            let p = new Promise(authenticator(conn, token));

            p.then(function (authData) {
                    pool.release(conn);
                    resolve(authData);
                },
                function (err) {
                    pool.release(conn);
                    reject(err);
                }
            );

        }, reject);
    });

}
