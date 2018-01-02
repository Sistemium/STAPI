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
      _.each(field.fields, (f, prop) => {
        parsed [key] [prop] = parseScalar(f, obj [key + '.' + prop], req, obj);
      });
    } else {

      let val = obj[key];

      // let grouping = req.params['groupBy:'];

      let sumKey = `sum(${key})`;
      let minKey = `min(${key})`;
      let maxKey = `max(${key})`;

      if (obj[sumKey]) {
        parsed [sumKey] = parseScalar(field, obj[sumKey], req, obj);
        return;
      } else if (obj[minKey]) {
        parsed [minKey] = parseScalar(field, obj[minKey], req, obj);
        parsed [maxKey] = parseScalar(field, obj[maxKey], req, obj);
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
