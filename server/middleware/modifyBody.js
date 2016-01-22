'use strict';
import _ from 'lodash';

/**
 * Middleware converts object to array, adds queryString params to each array element
 * @returns {Function}
 */
export default function () {
  return function (req, res, next) {

    let requestBody = req.body;
    if (req.method === 'POST') {
      if (typeof requestBody === 'object') {
        req.body = [requestBody];
      }

      let queryString = req.query;
      if (queryString) {
        _.each(queryString, (qStrParam) => {
          if (qStrParam.match(/[^:]/)) {
            _.each(requestBody, (arrElement) => {
              arrElement[qStrParam] = queryString[qStrParam];
            })
          }
        });
      }
    }

    next();
  }
}
