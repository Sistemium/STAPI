const _ = require('lodash');

export default function (config, params, domain, pool) {
  "use strict";

  function parseOrderByParams(params, alias) {

    let arr = params.split(',');
    let result = _.reduce(arr, (res, i) => {
      if (i[0] === '-') {
        res += `${alias}.${i.slice(1)} DESC`;
      } else {
        res += `${alias}.${i}`;
      }
      res += ', ';
      return res;
    }, '');
    result = result.slice(0, -2);
    return result;
  }

  function parseConfig(config) {
    let parsed = {};
    if (!_.isObject(config)) throw new Error('Model definition must be an object');
    _.each(Object.keys(config), (n) => {
      if (_.isString(config[n])) {
        parsed[n] = config[n];
      } else if (_.isObject(config[n])) {
        let propObj = config[n];
        if (propObj.hasOwnProperty('ref')) {
          let refConfig = domain.get(`${pool}/${propObj['ref'].toLowerCase()}`);
          if (!refConfig) {
            throw new Error('Invalid ref configuration...');
          } else {
            parsed[n] = {
              ref: propObj['ref'],
              property: n,
              field: propObj['field'],
              alias: refConfig['alias'],
              tableName: refConfig['tableName']
            };
          }
        }
        else if (config[n]['field'] && _.isString(config[n]['field'])) {
          parsed[n] = config[n]['field'];
        } else if (config[n]['expr']) {
          parsed[n] = {expr: config[n]['expr']};
        }
        else {
          throw new Error('Invalid model definition');
        }
      } else {
        throw new Error('Invalid model definition');
      }
    });

    return parsed;
  }

  /**
   *
   * @param cnfg
   * @param {string} tableName
   * @param {string} alias
   * @returns {string} query string
   */
  function makeQuery(cnfg, tableName, alias) {
    let escapeParams = [];
    let pageSize = parseInt(params['x-page-size:']) || 10;
    let startPage = ((parseInt(params['x-start-page:']) - 1) * pageSize || 0) + 1;
    let result = {
      query: '',
      params: []
    };

    if (!params['agg:']) {
      result.query += `SELECT TOP ? START AT ?  `;
      result.params.push(pageSize, startPage);
    } else {
      result.query += 'SELECT COUNT (*) as cnt';
    }

    if (alias === undefined) {
      alias = 't';
    }
    let refTableNames = new Map();

    if (!params['agg:']) {
      _.each(Object.keys(cnfg), (v) => {
        let propObj = cnfg[v];
        if (_.isObject(propObj)) {
          if (propObj.hasOwnProperty('ref')) {
            refTableNames.set(propObj['ref'], propObj);
            result.query += `[${v}].xid as [${v}]`;
          } else if (propObj.hasOwnProperty('expr')) {
            result.query += `${propObj.expr} as [${v}]`;
            escapeParams.push(propObj.expr, v);
          }
        }
        else if (propObj == v) {
          result.query += `[${alias}].[${propObj}]`;
        } else {
          result.query += `${alias}.${propObj} as ${v}`;
        }
        result.query += ', ';
      });
      result.query = result.query.slice(0, -2);
    }

    result.query += ` FROM ${tableName} as [${alias}]`;

    if (refTableNames.size > 0) {
      for (let ref of refTableNames) {
        result.query += ` JOIN ${ref[1].tableName} as [${ref[1].property}] on [${ref[1].property}].id = ${alias}.${ref[1].field} `;

      }
    }

    let withPredicate = false;
    let predicateStr = ` WHERE `;
    _.each(cnfg, (val, key) => {
      if (params && params[key]) {
        withPredicate = true;
        predicateStr += `${alias}.${cnfg[key]} = ? AND `;
        result.params.push(params[key]);
      }
    });

    if (withPredicate) {
      predicateStr = predicateStr.replace(/ AND $/i, '');
      result.query += predicateStr;
    }

    if (!params['agg:']) {
      if (params['x-order-by:']) {
        let orderBy = parseOrderByParams(params['x-order-by:'], alias);
        result.query += ` ORDER BY ${orderBy}`;
      } else {
        //default order by
        if (cnfg['ts'] === 'ts') {
          result.query += ` ORDER BY ${alias}.${cnfg.ts} DESC`;
        }
      }
    }

    return result;
  }

  let parsedConfig = parseConfig(config.fields);
  return makeQuery(parsedConfig, config.tableName, config.alias);
};
