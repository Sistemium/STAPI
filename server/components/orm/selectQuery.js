const _ = require('lodash');
const debug = require('debug')('stapi:orm:selectQuery');

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
   * @param cnfg {object} configuration object
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
    //@shipmentRoute
    tableName = tableName.replace(/(\${[^}]*})/g, function (p) {
      let param = p.match(/{([^\?}]*)/)[1];
      if (params[param]) {
        result.params.push(params[param]);
        return `[${param}] = ?`;
      }
      else if (p.match(/\?}$/)) {
        return '';
      } else {
        throw new Error(`Required parameter missing: "${param}"`);
      }
    });
    result.query += ` FROM ${tableName} as [${alias}]`;

    if (refTableNames.size > 0) {
      for (let ref of refTableNames) {
        result.query += ` JOIN ${ref[1].tableName} as [${ref[1].property}] on [${ref[1].property}].id = ${alias}.${ref[1].field} `;
      }
    }

    //if join in config
    if (cnfg.join) {
      result.query += ` ${cnfg.join} `
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

    //if predicate exist in config
    if (cnfg.predicate) {
      withPredicate = true;
      predicateStr += `${cnfg.predicate} AND `;
    }

    function concatSearchStr(searchFields, searchFor, params) {

      let likeStr = '';

      _.each(searchFields, (field) => {
        //check that passed field is in config
        if (cnfg.fields[field]) {
          likeStr += `${field} LIKE ? OR `;
          params.push(`%${searchFor}%`);
        } else {
          console.log(`No such field ${field} defined...`);
          throw new Error(`No such field ${field} defined...`);
        }
      });

      return likeStr.replace(/ OR $/i, '');
    }

    if (!params['agg:']) {

      if (params['q:']) {
        withPredicate = true;
        let q = params['q:'];
        if (q) {
          try {
            let parsed = JSON.parse(q);
            var searchFields = parsed.searchFields;
            var searchFor = parsed.searchFor;
            debug('selectQuery', `${searchFields}`);
            if (_.isString(searchFields)) {
              searchFields = searchFields.split(',');
            }
            predicateStr += '(' + concatSearchStr(searchFields, searchFor, result.params) + ')';
          }
          catch
            (err) {
            throw new Error(err);
          }
        }
      }
    }

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
        if (cnfg.fields['ts'].field === 'ts') {
          result.query += ` ORDER BY ${alias}.${cnfg.fields['ts'].field} DESC`;
        }
      }
    }


    result.query = result.query.replace(/\n/g, '');
    return result;
  }

  return makeQuery(config);
}
;
