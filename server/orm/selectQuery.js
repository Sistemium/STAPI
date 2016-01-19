const _ = require('lodash');

export default function (config, params, map, pool) {
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

  /**
   *
   * @param cnfg
   * @param {string} tableName
   * @param {string} alias
   * @returns {string} query string
   */
  function makeQuery(cnfg) {
    let tableName = cnfg.tableName;
    let alias = cnfg.alias;
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
      let fields = cnfg.fields;

      _.each(Object.keys(fields), (v) => {

        let propObj = fields[v];
        if (propObj.hasOwnProperty('ref')) {
          refTableNames.set(propObj['ref'], propObj);
          result.query += `[${v}].xid as [${v}]`;
        } else if (propObj.hasOwnProperty('expr')) {
          result.query += `${propObj.expr} as [${v}]`;
          escapeParams.push(propObj.expr, v);
        } else {
          result.query += `[${alias}].[${propObj['field']}] as ${v}`;
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

  //link ref config to config with ref fields
  _.each(config.fields, (val, field) => {
    if (val.hasOwnProperty('ref')) {
      let refConfig = map.get(`${pool}/${val['ref'].toLowerCase()}`);
      config.fields[field].alias = refConfig.alias;
      config.fields[field].tableName = refConfig.tableName;
    }
  });

  return makeQuery(config);
};
