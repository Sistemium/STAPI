'use strict';
const _ = require('lodash');
const debug = require('debug')('stapi:headersToParams');

export default function () {
  return function (req, res, next) {

    debug('params', req.params);

    let supportedHeaders = /x-page-size|x-start-page|x-order-by|x-offset/i;

    function headersToParams(headers) {

      var params = {};

      _.forEach(headers, function (val, key) {
        if (key.match(supportedHeaders)) {
          params [key + ':'] = val;
        }
      });

      return params;
    }

    let xParams = _.assign(headersToParams(req.headers), req.query, req.params.id && { id: req.params.id });

    if (req.params.filterCollection && req.params.filterCollectionId) {
      xParams [req.params.filterCollection] = req.params.filterCollectionId;
    }

    if (xParams['searchFor:'] && xParams['searchFields:']) {
      xParams['q:'] = {
        searchFields: xParams ['searchFields:'],
        searchFor: xParams ['searchFor:']
      }
    } else {
      if (_.isString(xParams['q:'])) {
        try {
          xParams['q:'] = JSON.parse(xParams['q:']);
        } catch (e) {
          return res.status(400).end('Invalid JSON in q:');
        }
      }
    }

    const whereFilter = xParams['where:'];

    if (whereFilter) {
      try {

        let where = _.isString(whereFilter) ? JSON.parse(xParams['where:']) : whereFilter;

        xParams['where:'] = where;
        _.each(where, (predicates, field) => {


          _.each(predicates, (value, operator) => {

            let fieldParam = xParams[field];

            switch (operator) {
              case '>':
                xParams[field] = { value, operator };
                break;
              case '>=':
                if (_.get(fieldParam, 'operator') === '<=') {
                  xParams[field] = { value: [value, fieldParam.value], operator: 'between' };
                }
              case '<=': {
                if (_.get(fieldParam, 'operator') === '>=') {
                  xParams[field] = { value: [fieldParam.value, value], operator: 'between' };
                } else {
                  xParams[field] = { value, operator };
                }
                break;
              }
              case '!=': {
                if (value === null) {
                  xParams[field] = { value: 'not null', operator: 'is' };
                } else {
                  xParams[field] = { value, operator: '<>' };
                }
                break;
              }
              case '==': {
                if (value === null) {
                  xParams[field] = { value: 'null', operator: 'is' };
                } else {
                  xParams[field] = value;
                }
                break;
              }
              case 'in': {
                let inRes = _.isArray(value) ? value : [value || null];
                if (!inRes.length) {
                  return res.status(204);
                }
                xParams[field] = inRes;
                break;
              }
              case 'like':
              case 'likei': {
                xParams[field] = { value, operator: 'like' };
                break;
              }
            }

          });

        });

      } catch (e) {
        // console.error(e);
        return res.status(400).end('Invalid JSON in where:');
      }
    }

    debug('x-params', xParams);

    req['x-params'] = xParams;

    next();
  }
}
