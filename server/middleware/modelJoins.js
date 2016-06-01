'use strict';
const _ = require('lodash');
const debug = require('debug')('stapi:modelJoins');


function joinObj (collection, pred, predRes) {
  let sql, params;
  if (_.isString(predRes)) {
    sql = predRes;
  } else {
    sql = predRes.sql;
    params = predRes.params;
  }
  return {
    field: pred.field,
    sql: sql,
    collection: collection,
    params: params
  };
}


export default function () {
  return function (req, res, next) {
    let config = res.locals.config;
    res.locals.joins = [];

    function makeJoin(joins, collection) {

      let arr = [];
      //redundant check
      if (Array.isArray(joins)) {

        _.each(joins, (pred) => {

          let predRes;

          if (typeof pred === 'function') {
            predRes = pred(req);
            if (predRes) {
              arr.push(joinObj(collection,pred,predRes));
            }
          } else if (typeof pred === 'string') {
            arr.push({
              collection: collection,
              sql: pred
            });
          } else if (pred.fn) {
            if (pred.method && !req.method.match(pred.method)) {
              return;
            }
            predRes = pred.fn(req);
            if (predRes) {
              arr.push(joinObj(collection,pred,predRes));
            }
          } else {
            next('Incorrect config, join must be array of functions or strings...');
          }

          if (predRes === false) {
            res.status(403);
            debug('makeJoin false', pred);
            next('Forbidden');
            return false;
          }

        });
      }

      //debug('makeJoin', arr);
      return arr;
    }

    function checkJoins(cfg, alias) {
      let joins = _.cloneDeep (cfg.joins || cfg.join && [cfg.join] || []);
      if (typeof cfg.deletable === 'string') {
        //debug('checkJoins', alias, cfg);
        joins.push(`NOT ${alias || cfg.alias}.${cfg.deletable}`);
      }
      if (joins.length) {
        res.locals.joins = res.locals.joins.concat(makeJoin(joins, alias));
      }
    }

    _.each(config.fields, (val, key) => {
      let ref = val.refConfig;
      let ignoreJoins = val.ignoreJoins;
      if (ref && _.isObject(ignoreJoins)) {
        if (ignoreJoins.method && req.method.match(ignoreJoins.method)) {
          checkJoins(ref, val.alias);
        }
      }
      else if (ref && !ignoreJoins) {
        checkJoins(ref, val.alias);
      }
    });

    checkJoins(config, config.alias);

    debug('result', res.locals.joins);

    next();
  }
}
