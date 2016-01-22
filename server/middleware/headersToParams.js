'use strict';
const _ = require('lodash');
const debug = require('debug')('stapi:headersToParams');

export default function () {
  return function (req, res, next) {

    debug ('params', req.params);

    let supportedHeaders = /x-page-size|x-start-page|x-order-by/i;

    function headersToParams(headers) {

      var params = {};

      _.forEach(headers, function (val, key) {
        if (key.match(supportedHeaders)) {
          params [key + ':'] = val;
        }
      });

      return params;
    }

    req['x-params'] = _.assign(headersToParams(req.headers), {id: req.params.id}, req.query);

    if (req.params.filterCollection && req.params.filterCollectionId) {
      req['x-params'][req.params.filterCollection] = req.params.filterCollectionId;
    }

    debug ('x-params',req['x-params']);

    next();
  }
}
