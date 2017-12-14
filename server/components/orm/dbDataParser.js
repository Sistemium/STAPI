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

  if (!obj) {
    return null;
  }

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

        let minKey = `min(${key})`;
        let maxKey = `max(${key})`;

        val = obj[minKey];

        if (val) {
          parsed [minKey] = parseScalar(field, val, req, obj);
          parsed [maxKey] = parseScalar(field, obj[maxKey], req, obj);
          return;
        } else {
          val = (parsed [key] = obj [key]);
        }

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
