'use strict';
import _ from 'lodash';
var debug = require('debug')('stapi:modifyBody');
var uuid = require ('node-uuid');

/**
 * Middleware converts object to array, adds queryString params to each array element
 * @returns {Function}
 */
export default function () {
  return function (req, res, next) {

    let requestBody = req.body;
    let config = res.locals.config;

    if (req.method === 'POST' || req.method === 'PUT') {

      if (Array.isArray(requestBody)) {
        if (req.method === 'PUT') {
          return res.status(400).end('PUT requires object');
        }
      } else if (typeof requestBody === 'object') {
        req.body = [requestBody];
        req.wasOneObject = true;
      }

      applyParams(req['x-params'],req.body);

      if (req.wasOneObject && !req.body[0].id) {
        req.body[0].id = (req.createMode = uuid.v4());
      }

      if (config) {
        req.body = applyConverters (config,req);
      }

    }

    debug ('body:',req.body);
    next();

  };

}

var applyConverters = (config,req) => {

  return _.map(req.body, item => {

    var fields = {};

    _.each (config.fields, (field, key) => {

      if (!field || field.readonly && !field.converter) {
        return;
      }

      let val = item [key];

      if (field.converter) {
        fields [key] = field.converter (val, req, item);
      } else {
        fields [key] = val || null;
      }

    });

    return fields;

  });

};

var applyParams = (params,bodyArray) => {

  let queryString = _.transform(params, (result, value, key) => {
    if (value && !key.match(/:$/)) {
      result[key] = value;
    }
  });

  if (queryString) {
    _.each(bodyArray, item => {
      _.each(queryString, (val,key) => {
        item [key] = val;
      });
    });
  }

};
