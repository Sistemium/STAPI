'use strict';

const _ = require('lodash');
const debug = require('debug')('stapi:orm:dbDataParser');

function parseScalar(field, val, req) {
  if (field.parser) {
    if (!(val == null || val == undefined)) {
      return field.parser(val, req);
    }
  }
  return val;
}

function parseObject(config, obj, req) {

  let parsed = {};

  _.each(config.fields, (field, key) => {

    if (field.fields) {
      parsed [key] = {};
      _.each(field.fields, function (f, prop) {
        parsed [key] [prop] = parseScalar(f, obj [key + '.' + prop]);
      });
    } else {
      let val = (parsed [key] = obj [key]);
      if (field.parser) {
        if (!(val == null || val == undefined)) {
          parsed [key] = parseScalar(field, val, req);
        }
      }
    }
  });

  return parsed;

}

export default parseObject;
