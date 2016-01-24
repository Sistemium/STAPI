'use strict';
import _ from 'lodash';
var debug = require('debug')('stapi:modifyBody');

/**
 * Middleware converts object to array, adds queryString params to each array element
 * @returns {Function}
 */
export default function () {
  return function (req, res, next) {

    let requestBody = req.body;

    if (req.method === 'POST' || req.method === 'PUT') {

      if (Array.isArray(requestBody)) {
        if (req.method === 'PUT') {
          return res.status(400).end('PUT requires object');
        }
      }
      else if (typeof requestBody === 'object') {
        req.body = [requestBody];
      }

      applyParams(req['x-params'],req.body);

    }

    debug ('body:',req.body);
    next();

  };

}


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
