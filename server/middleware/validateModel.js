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
          validator.fn(req, item[validator.field]) :
          validator.fn(req, item);
        if (v) {
          if (validator.field) {
            msgs.push(`Invalid value for field '${validator.field}' '${item[validator.field]}': ` + v);
          } else {
            msgs.push(`Invalid values '${item}'`);
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
