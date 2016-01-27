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

          let predRes;

          if (typeof pred === 'function') {
            predRes = pred(req);
            if (predRes) {
              arr.push(predRes);
            }
          } else if (typeof pred === 'string') {
            arr.push(pred);
          } else if (pred.fn) {
            predRes = pred.fn(req);
            if (predRes) {
              arr.push({
                field: pred.field,
                sql: predRes,
                collection: collection
              });
            }
          } else {
            next('Incorrect config, predicate must be array of functions or strings...');
          }

          if (predRes===false) {
            res.status(403);
            next ('Not authorized');
            return false;
          }

        });
      }

      debug('makePredicate', arr);
      return arr;
    }


    //get all ref predicates
    function checkPredicates(ref) {
      let predicates = ref.predicates || ref.predicate && [ref.predicate];

      if (predicates) {
        res.locals.predicates = res.locals.predicates.concat(makePredicate(predicates, ref.collection));
      }
    }

    _.each(config.fields, (val) => {
      let ref = val.refConfig;
      if (ref) {
        checkPredicates(ref);
      }
    });

    checkPredicates(config);

    debug('result', res.locals.predicates);

    next();
  }
}
