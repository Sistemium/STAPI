'use strict';
const _ = require('lodash');
const debu = require('debug');


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


export default function (singular) {

  let plural = singular + 's';
  let debug = debu ('stapi:model'+_.upperFirst(plural));

  return function (req, res, next) {

    let config = res.locals.config;
    res.locals[plural] = [];

    function makePredicate(predicates, collection) {

      let arr = [];
      //redundant check
      if (Array.isArray(predicates)) {

        _.each(predicates, (pred) => {

          let predRes;

          if (typeof pred === 'function') {
            predRes = pred(req);
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
            predRes = pred.fn(req);
            if (predRes) {
              arr.push(predicateObj(collection,pred,predRes));
            }
          } else {
            next('Incorrect config, predicate must be array of functions or strings...');
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
      let predicates = _.cloneDeep (cfg[plural] || cfg[singular] && [cfg[singular]] || []);
      if (predicates.length) {
        res.locals[plural] = res.locals[plural].concat(makePredicate(predicates, alias));
      }
    }

    _.each(config.fields, (val) => {
      let ref = val.refConfig;
      let ignorePredicates = val['ignore' + _.upperFirst(plural)];
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

    debug('result', res.locals[plural]);

    next();
  }
}
