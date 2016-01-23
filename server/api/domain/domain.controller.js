'use strict';

const debug = require('debug')('stapi:domain:controller');
const orm = require('../../components/orm/orm');
const _ = require('lodash');
const pools = require('../../components/pool');

var errorHandler = function (err, conn, pool, res) {

  console.error('Client:', conn.number, 'exec error:', err);

  if (err.code.match(/(-308)(-2005)(-121)/ig)) {
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

  debug('index.doSelect', 'start');

  let query;
  let config = res.locals.config;
  try {
    query = orm.select(config, req['x-params']);
  } catch (err) {
    debug('doSelect', `exception ${err.stack} `);
    return res.status(400).end(err.message);
  }
  debug('index.doSelect', 'conn:', conn.name, 'request:', query);

  conn.exec(query.query, query.params, function (err, result) {

    debug('index.doSelect', 'exec done');

    if (err) {
      return errorHandler(err, conn, pool, res);
    }

    conn.busy = false;
    pool.release(conn);

    function parseObject(obj) {

      let parsed = {};

      _.each(config.fields, (field, key) => {

        if (field.fields) {
          parsed [key] = {};
          _.each (field.fields, function(parentProp){
            parsed [key] [parentProp] = obj [key + '.' + parentProp];
          });
        } else {
          let val = (parsed [key] = obj [key]);
          if (field.parser) {
            if (!(val == null || val == undefined)) {
              parsed [key] = field.parser(val);
            }
          }
        }

      });

      return parsed;

    }

    if (req.params.id) {
      result = result.length ? parseObject(result[0]) : undefined;
    } else if (Array.isArray(result)) {
      _.each(result, (item, i) => {
        result [i] = parseObject(item);
      });
    }

    debug('index', 'parseObject done');

    if (!result) {
      return res.status(404).json();
    } else if (req.params.id || result.length) {

      if (req['x-params']['agg:']) {
        res.set('X-Aggregate-Count', result[0].cnt);
        return res.status(204).end();
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
  let pool = pools(req.pool);

  pool.customAcquire(req.headers.authorization).then(function (conn) {
    req.on('close', function () {
      console.error('Client:', conn.number, 'request closed unexpectedly');
      conn.rejectExec();
    });

    doSelect(pool, conn, req, res);
  }, function (err) {
    console.log(err);

    res.status(500).end(err);
  });
}

export function post(req, res, next) {
  var pool = pools(req.pool);

  if (_.isEmpty(req.body)) {
    return res.status(400) && next('Empty body');
  }

  pool.customAcquire(req.headers.authorization).then(function (conn) {

    req.on('close', function () {
      console.error('Client:', conn.number, 'request closed unexpectedly');
      conn.rejectExec()
    });

    execReqBody(req.body, pool).then(() => {
      conn.commit(() => {
        pool.release(conn);

        if (rowsAffected) {
          return res.status(200).set('X-Rows-Affected', rowsAffected).end();
        } else {
          return res.status(404).end();
        }
      });
    });

    let rowsAffected = 0;

    function execReqBody(arr, pool) {

      return new Promise((resolve) => {
        let arrLength = arr.length;
        let counter = 0;
        _.each(arr, (body) => {
          let query = orm.insert(res.locals.config, body);

          debug('connection', conn.name, 'query:', query.query, 'params:', query.params);

          conn.execWithoutCommit(query.query, query.params, (err, affected) => {
            if (err) {
              return errorHandler(err, conn, pool, res);
            }

            if (affected) {
              rowsAffected += affected;
            }

            counter++;
            if (arrLength === counter) {
              resolve();
            }
          });
        });
      });
    }
  });
}

