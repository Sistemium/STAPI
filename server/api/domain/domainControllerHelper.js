'use strict';

const debug = require('debug')('stapi:domain:helper');
import {select, insert, deleteQ, parseDbData} from '../../components/orm/orm';
import _ from 'lodash';
import url from 'url';
// import async from 'async';

export {errorHandler, doSelect, locationUrl};


function locationUrl (req, id) {
  return url.format({
    pathname: `${req.path}/${id}`,
    port: process.env.PORT,
    hostname: req.hostname,
    protocol: 'http'
  });
}

function statusByErr (err) {

  if (err.code === '-70001') {
    return 404;
  } else if (err.code === '-70002') {
    return 403;
  }

  return 500;

}

function errorHandler (err, conn, pool, res) {

  console.error('Client:', conn.number, 'exec error:', err);

  if (err.code.match(/(-308)|(-2005)|(-121)|(-101)|(-685)/ig)) {
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
    res.json(err);
  } else {
    res.end();
  }

}

function getOffset(data) {
  if (!data.length) {
    return null;
  }

  let top1 = _.last(data);

  return `1-${top1.ts.replace(/[^\d]/g, '')}-${top1.IDREF}`;
}

function doSelect (pool, conn, req, res) {

  debug('index.doSelect', 'start');

  let query;
  let config = res.locals.config;

  try {
    let params = {
      config: config,
      params: req['x-params'],
      predicates: res.locals.predicates,
      joins: res.locals.joins
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

    let offset = req['x-params']['x-offset:'] && result.length && getOffset(result);

    if (req.params.id) {
      result = result.length ? parseDbData(config, result[0], req) : undefined;
    } else if (!req['x-params']['agg:'] && Array.isArray(result)) {
      _.each(result, (item, i) => {
        result [i] = parseDbData(config, item, req);
      });
    }

    if (!result) {
      return res.status(404).json();
    } else if (req.params.id || result.length) {

      if (req['x-params']['agg:']) {

        var cnt = result.length && result[0].cnt || result.cnt || 0;

        res.set('X-Aggregate-Count', cnt);

        return res.json({
          count: cnt
        });

      } else if (result.length) {
        res.set('X-Rows-Count', result.length);
        if (offset) {
          res.set('X-Offset', offset);
        }
      }

      return res.status(200).json(result);
    } else {
      return res.status(204).json();
    }

  });
}
