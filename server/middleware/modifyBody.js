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
      let queryString = req.query;
      if (Array.isArray(requestBody)) {
        if (req.method === 'PUT') {
          return res.status(400).end('PUT requires object');
        }
        if (queryString) {
          _.each(queryString, (qStrParam) => {
            if (!qStrParam.match(/:$/)) {
              _.each(requestBody, item => {
                item [qStrParam] = queryString[qStrParam];
              })
            }
          });
        }
      }
      else if (typeof requestBody === 'object') {
        req.body = [requestBody];
      }
    }
    debug ('body:',req.body);
    next();
  }
}
