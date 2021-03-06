'use strict';
const _ = require('lodash');
const debug = require('debug')('stapi:modelPredicates');


function predicateObj (collection, pred, predRes) {
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
    res.locals.predicates = [];

    function makePredicate(predicates, collection) {

      let arr = [];
      //redundant check
      if (Array.isArray(predicates)) {

        _.each(predicates, (pred) => {

          let predRes;

          if (typeof pred === 'function') {
            predRes = pred(req, collection);
            if (predRes) {
              arr.push(predicateObj(collection,pred,predRes));
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
            predRes = pred.fn(req, collection);
            if (predRes) {
              arr.push(predicateObj(collection,pred,predRes));
            }
          } else {
            next('Incorrect config, predicate must function or string or object with fn function.');
          }

          if (predRes === false) {
            res.status(403);
            debug('makePredicate false', pred);
            next('Forbidden');
            return false;
          }

        });
      }

      //debug('makePredicate', arr);
      return arr;
    }

    function checkPredicates(cfg, alias) {
      let predicates = _.cloneDeep (cfg.predicates || cfg.predicate && [cfg.predicate] || []);
      if (typeof cfg.deletable === 'string') {
        //debug('checkPredicates', alias, cfg);
        predicates.push(`NOT ${alias || cfg.alias}.${cfg.deletable}`);
      }
      if (predicates.length) {
        res.locals.predicates = res.locals.predicates.concat(makePredicate(predicates, alias));
      }
    }

    _.each(config.fields, (val, key) => {
      let ref = val.refConfig;
      let ignorePredicates = val.ignorePredicates;
      if (ref && _.isObject(ignorePredicates)) {
        if (ignorePredicates.method && req.method.match(ignorePredicates.method)) {
          checkPredicates(ref, val.alias);
        }
      }
      else if (ref && !ignorePredicates) {
        checkPredicates(ref, val.alias);
      }
    });

    checkPredicates(config, config.alias);

    debug('result', res.locals.predicates);

    next();
  }
}
