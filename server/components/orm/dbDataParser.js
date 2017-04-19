'use strict';

const _ = require('lodash');
const debug = require('debug')('stapi:orm:dbDataParser');

function parseScalar(field, val, req) {
  if (field.parser) {
    if (val !== null && val !== undefined || field.parseEmpty) {
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
        parsed [key] [prop] = parseScalar(f, obj [key + '.' + prop], req, obj);
      });
    } else {

      let sumKey = `sum(${key})`;
      let val = obj[sumKey];

      if (val) {
        key = sumKey;
      } else {
        val = (parsed [key] = obj [key]);
      }

      parsed [key] = parseScalar(field, val, req, obj);

    }

  });

  if (obj['count()']) {
    parsed['count()'] = obj['count()'];
  }

  return parsed;

}

export default parseObject;
