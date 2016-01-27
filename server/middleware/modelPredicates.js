'use strict';
const _ = require('lodash');
const debug = require('debug')('stapi:modelPredicates');

export default function () {
  return function (req, res, next) {
    let config = res.locals.config;
    res.locals.predicates = [];

    function makePredicate(predicates, collection) {

      let arr = [];
      //redundant check
      if (Array.isArray(predicates)) {

        _.each(predicates, (pred) => {
          if (typeof pred === 'function') {
            let fnResult = pred(req);
            if (fnResult) {
              arr.push(fnResult);
            }
          } else if (typeof pred === 'string') {
            arr.push(pred);
          } else if (pred.fn) {
            let fnResult = pred.fn(req);
            if (fnResult) {
              arr.push({
                field: pred.field,
                sql: fnResult,
                collection: collection
              });
            }
          } else {
            next('Incorrect config, predicate must be array of functions or strings...');
          }
        });
      }

      debug('makePredicate', arr);
      return arr;
    }

    //get all ref predicates
    _.each(config.fields, (val) => {
      let ref = val.refConfig;
      if (ref) {
        let predicates = ref.predicates || ref.predicate && [ref.predicate];

        if (predicates) {
          res.locals.predicates = res.locals.predicates.concat(makePredicate(predicates, ref.collection));
        }
      }
    });

    let predicates = config.predicates || config.predicate && [config.predicate];

    if (predicates) {
      res.locals.predicates = res.locals.predicates.concat(makePredicate(predicates, config.collection));
    }

    debug('result', res.locals.predicates);

    next();
  }
}
