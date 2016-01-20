'use strict';

var debug = require('debug')('stapi:dbAuth');
const pools = require('../../components/pool/poolManager');

export function dbAuth() {
  return function (req, res, next) {
    authDb(req, res, next);
  }
}

export function onConnect() {

  var conn = this;
  debug ('onConnect', 'start conn:', conn.number);

  return new Promise(function (resolve, reject) {
    conn.exec('create variable @UACToken string', function (err) {
      if (!err) {
        debug('onConnect', 'success conn:', conn.number);
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
  debug ('onAcquire', 'start conn:', conn.number);

  return new Promise(function (resolve, reject) {
    conn.exec(`set @UACToken = '${token}'`, function (err) {
      if (err) {
        reject(err);
      } else {
        debug ('onAcquire', 'success conn:', conn.number);
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

  function setAuthor(id) {
    if (req.method === 'POST') {
      req.body.author = id;
    }
  }

  let token = req.headers.authorization;

  let pool = pools.getPoolByName(req.pool);

  let authMap = (pool.authMap = pool.authMap || new Map());

  let auth = authMap.get(token);

  if (auth) {
    setAuthor(auth.id);
    next();
  } else {
    debug ('doAuth', 'start');
    doAuth(pool, token).then(function (authData) {
      debug ('doAuth', 'success account.id:', authData.id);
      authMap.set(token, authData);
      setAuthor(authData.id);
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
