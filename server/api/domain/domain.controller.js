import _ from 'lodash';
import async from 'async';

import {select, insert, deleteQ, parseDbData} from '../../components/orm/orm';
import {doSelect, errorHandler, locationUrl} from './domainControllerHelper';
import {getPoolByName} from '../../components/pool';

const debug = require('debug')('stapi:domain:controller');
const error = require('debug')('stapi:error:domain:controller');

export function index(req, res, next) {
  let pool = getPoolByName(req.pool);

  pool.customAcquire(req.headers.authorization).then(conn => {

    req.on('close', function () {
      console.error('Client:', conn.number, 'request closed unexpectedly');
      conn.rejectExec();
    });

    doSelect(pool, conn, req, res);

  }, err => {
    console.error('index:customAcquire', err);
    res.status(500) && next(new Error(err.text));
  });
}

export function post(req, res, next) {

  const pool = getPoolByName(req.pool);
  let config = res.locals.config;

  if (_.isEmpty(req.body)) {
    return res.status(400) && next('Empty body');
  }

  if (config.readonly) {
    return res.status(403) && next('Collection is read-only');
  }

  pool.customAcquire(req.headers.authorization).then(conn => {

    let rowsAffected = 0;
    let responseArray = [];

    function execReqBody(item, done) {
      try {

        let {config, predicates, joins} = res.locals;
        let query = insert(config, item, predicates, pool.config, joins);

        if (req.body.length === 1) {
          debug('insert', conn.name, 'query:', query.query, 'params:', query.params);
        }

        conn.execWithoutCommit(query.query, query.params, (err, affected) => {

          if (err) {
            error('execWithoutCommit:', query.query, query.params);
            return done(err);
          }

          if (affected) {
            rowsAffected++;
            if (typeof affected === 'object') {
              debug('affected:', affected);
              let insertedResponse = affected[0];

              if (!insertedResponse) {
                return done({code: '-70002', text: 'Empty response after merge'});
              }

              let parsed = parseDbData(config, affected[0]);
              responseArray.push(parsed);
              // debug('parsed:', parsed);
            }
          }

          debug('rowsAffected:', rowsAffected);

          done();
        });
      } catch (err) {
        return done(err);
      }
    }

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

        let returnPost = pool.config.returnPost || req.headers['x-return-post'];

        if (rowsAffected) {
          let response;
          if (returnPost) {
            if (!responseArray.length) {
              responseArray = req.body;
            }
            response = req.wasOneObject ? responseArray [0] : responseArray;
          }
          if (req.createMode) {
            return res.status(201)
              .set('Location', locationUrl(req, req.createMode))
              .json(response);
          }
          return res.status(200)
            .set('X-Rows-Affected', rowsAffected)
            .json(response);
        } else {
          return res.sendStatus(404);
        }
      });

    });

  }, function (err) {
    console.error('post:customAcquire', err);
    res.status(500) && next(new Error(err.text));
  });

}

export function del(req, res, next) {

  let pool = getPoolByName(req.pool);

  if (!res.locals.config.deletable) {
    return res.status(403) && next('Collection is not deletable');
  }

  pool.customAcquire(req.headers.authorization).then((conn) => {

    let config = res.locals.config;

    try {

      let params = {
        config: config,
        params: req['x-params'],
        predicates: res.locals.predicates,
        selectFields: ['id'],
        noPaging: true
      };

      let selectQueryObj = select(params);
      debug('delete select query:', selectQueryObj);

      let query = deleteQ(config, selectQueryObj, req);
      debug('delete query:', query);

      if (!query) {
        pool.release(conn);
        return res.status(404).end();
      }

      conn.exec(query.query, query.params, (err, result) => {

        if (err) {
          return errorHandler(err, conn, pool, res);
        }

        pool.release(conn);

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
