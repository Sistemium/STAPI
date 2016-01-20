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

  debug('index', 'start');

  if (req.method === 'HEAD') {
    req['x-params']['agg:'] = true;
  }

  let query;
  let config = res.locals.config;
  try {
    query = orm.select(config, req['x-params'], req.app.locals.domainConfig, req.pool);
  } catch (err) {
    return res.status(400).end();
  }
  console.log('Client:', conn.number, 'request:', query);

  conn.exec(query.query, query.params, function (err, result) {

    debug('index', 'exec done');

    if (err) {
      return errorHandler(err, conn, pool, res);
    }

    conn.busy = false;
    pool.release(conn);

    if (req.params.id) {
      _.each(result[0], (val, key) => {
        debug('conn exec done', `${config['fields'][key]}`);
        if (config['fields'][key].parser) {
          result[0][key] = config['fields'][key].parser(val);
        }
      });
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

      _.each(result, (item) => {
        _.each(item, (val, key) => {
          debug('index', `before parsing ${key}: ${JSON.stringify(config['fields'][key])}`);
          if (config['fields'][key].parser) {
            item[key] = config['fields'][key].parser(val);
          }
        });
      });
      debug('index', 'after parsing');

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

    console.log(req.body);

    let query = orm.insert(req.body, req.app.locals.domain, req.app.locals.domainConfig, req.pool);
    console.log('Client:', conn.number, 'query:', query.query, 'params:', query.params);

    conn.exec(query.query, query.params, function (err, rowsAffected) {

      if (err) {
        return errorHandler(err, conn, pool, res);
      }

      pool.release(conn);

      if (rowsAffected) {
        return res.status(200).set('X-Rows-Affected', rowsAffected).end();
      } else {
        return res.status(404).end();
      }

    });
  });
}
