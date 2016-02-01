'use strict';

const debug = require('debug')('stapi:domain:controller');
import {select, insert, deleteQ} from '../../components/orm/orm';
const _ = require('lodash');
import pools from '../../components/pool';
var async = require('async');

var statusByErr = (err) => {

  if (err.code === '-70001') {
    return 404;
  } else if (err.code === '-70002') {
    return 403;
  }

  return 500;

};


var errorHandler = function (err, conn, pool, res) {

  console.error('Client:', conn.number, 'exec error:', err);

  if (err.code.match(/(-308)(-2005)(-121)(-101)/ig)) {
    console.log('Pool will destroy conn:', conn.number);
    pool.destroy(conn);
  } else {
    conn.busy = false;
    conn.rollback(function () {
      pool.release(conn);
    });
  }

  let status = statusByErr(err);

  res.status(status);

  if (status == 500) {
    res.json (err);
  } else {
    res.end ();
  }

};


var doSelect = function (pool, conn, req, res) {

  debug('index.doSelect', 'start');

  let query;
  let config = res.locals.config;
  try {
    let params = {
      config: config,
      params: req['x-params'],
      predicates: res.locals.predicates
    };
    query = select(params);
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

    function parseScalar (field, val) {
      if (field.parser) {
        if (!(val == null || val == undefined)) {
          return field.parser(val);
        }
      }
      return val;
    }

    function parseObject(obj) {

      let parsed = {};

      _.each(config.fields, (field, key) => {

        if (field.fields) {
          parsed [key] = {};
          _.each (field.fields, function(f,prop){
            parsed [key] [prop] = parseScalar (f, obj [key + '.' + prop]);
          });
        } else {
          let val = (parsed [key] = obj [key]);
          if (field.parser) {
            if (!(val == null || val == undefined)) {
              parsed [key] = parseScalar(field,val);
            }
          }
        }
      });

      return parsed;

    }

    if (req.params.id) {
      result = result.length ? parseObject(result[0]) : undefined;
    } else if (!req['x-params']['agg:'] && Array.isArray(result)) {
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

export function index(req, res, next) {
  let pool = pools(req.pool);

  pool.customAcquire(req.headers.authorization).then(function (conn) {
    req.on('close', function () {
      console.error('Client:', conn.number, 'request closed unexpectedly');
      conn.rejectExec();
    });

    doSelect(pool, conn, req, res);
  }, function (err) {
    console.error('index:customAcquire', err);
    res.status(500) && next (new Error (err.text));
  });
}

export function post(req, res, next) {
  var pool = pools(req.pool);

  if (_.isEmpty(req.body)) {
    return res.status(400) && next('Empty body');
  }

  let rowsAffected = 0;

  pool.customAcquire(req.headers.authorization).then (conn => {

    var execReqBody = (item, done) => {
      try {
        let query = insert(res.locals.config, item, res.locals.predicates);

        debug('insert', conn.name, 'query:', query.query, 'params:', query.params);

        conn.execWithoutCommit(query.query, query.params, (err, affected) => {
          if (err) {
            return done (err);
          }

          if (affected) {
            rowsAffected += affected;
          }

          debug ('rowsAffected:', rowsAffected);

          done();
        });
      } catch (err) {
        return done(err);
      }
    };

    req.on('close', function () {
      console.error('Client:', conn.number, 'request closed unexpectedly');
      conn.rejectExec()
    });

    // TODO use prepared statements
    async.eachSeries(req.body, execReqBody, err => {

      if (err) {
        return errorHandler(err, conn, pool, res);
      }

      conn.commit(() => {
        pool.release(conn);

        if (rowsAffected) {
          return res.status(200).set('X-Rows-Affected', rowsAffected).end();
        } else {
          return res.status(404).end();
        }
      });

    });

  },function (err){
    console.error ('post:customAcquire', err);
    res.status(500) && next (new Error (err.text));
  });

}

export function del(req, res, next) {

  let pool = pools(req.pool);

  pool.customAcquire(req.headers.authorization).then ((conn) => {

    let config = res.locals.config;
    try {
      let params = {
        config: config,
        params: req['x-params'],
        predicates: res.locals.predicates,
        selectFields: ['id']
      };
      let selectQueryObj = select(params);
      debug(selectQueryObj);
      let query = deleteQ(config, selectQueryObj);
      debug('del.q', 'query:', query);

      conn.exec(query.query, query.params, (err, result) => {
        if (err) {
          return errorHandler(err, conn, pool, res);
        }

        if (!result) {
          return res.status(404).end();
        } else {
          return res.status(200).set('X-Rows-Affected', result).end();
        }
      });

    } catch (err) {
      debug('del', 'exception', err.stack);
      return res.status(400).end(err.message);
    }

  }, (err) => {
    debug('del', 'customAcquire error:', err);
    return res.status(500) && next(new Error(err.text));
  });

}
