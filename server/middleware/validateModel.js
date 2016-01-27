'use strict';
const _ = require('lodash');
const debug = require('debug')('stapi:validateModel');

function collectValidators(config) {

  let validators = [];

  let fn = (config) => {

    _.each(config, (val, key) => {

      if (key === 'validators') {
        _.each(Array.isArray(val) && val || [val], (item) => {
          validators.push({
            fn: item
          });
        });
      } else if (typeof val.validator === 'function') {
        validators.push({
          fn: val.validator,
          field: key
        });
      } else if (typeof val.validators === 'object') {
        _.each(val.validators, (validator) => {
          if (typeof validator === 'function') {
           validators.push({
             fn: validator,
             field: key
           });
          }
        });
      } else if (key === 'fields') {
        fn(val);
      }
    });
  };

  fn(config);

  return validators;
}

export default function () {
  return (req, res, next) => {

    var validators = collectValidators(res.locals.config);
    debug('validateModel', validators);
    var msgs = [];

    _.each(req.body, function (item) {
      _.each(validators, function (validator) {
        var v = validator.field ?
          validator.fn(item[validator.field], req) :
          validator.fn(item, req);
        if (v) {
          if (validator.field) {
            msgs.push({
              message: `Invalid value '${item[validator.field]}' for field '${validator.field}': ` + v,
              field: validator.field,
              value: item[validator.field]
            });
          } else {
            msgs.push({
              message: `Invalid values '${res.locals.config.collection}': ` + v
            });
          }
        }
      });
    });

    if (msgs.length) {
      res.status(406).json(msgs);
    } else {
      next();
    }

  };
}
