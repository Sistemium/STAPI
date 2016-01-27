'use strict';
const _ = require('lodash');

export default function () {
  return function (req, res, next) {
    let config = res.locals.config;

    function makePredicate(predicates) {

      let arr = [];
      if (Array.isArray(predicates)) {
        _.each(predicates, (pred) => {
          if (typeof pred === 'function') {
            let fnResult = pred(req);
            if (fnResult) {
              arr.push(fnResult);
            }
          } else if (typeof pred === 'string') {
            arr.push(pred);
          } else {
            next('Incorrect config, predicate must be array of functions or strings...');
          }
        });
      }

      return arr;
    }

    let predicates = config.predicates || config.predicate && [config.predicate];

    if (predicates) {
      res.locals.predicates = makePredicate(predicates);
    }

    next();
  }
}
