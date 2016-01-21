const _ = require('lodash');
const debug = require('debug')('stapi:orm:selectQuery');

export default function (config, params) {
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

  function concatSearchStr(searchFields, searchFor, params, fields) {

    let likeStr = '';

    _.each(searchFields, (field) => {
      //check that passed field is in config
      if (fields[field]) {
        likeStr += `${field} LIKE ? OR `;
        params.push(`%${searchFor}%`);
      } else {
        console.log(`No such field ${field} defined...`);
        throw new Error(`No such field ${field} defined...`);
      }
    });

    return likeStr.replace(/ OR $/i, '');
  }

  /**
   *
   * @param cnfg {object} configuration object
   * @returns {string} query string
   */
  function makeQuery(cnfg) {

    let tableName = cnfg.selectFrom;
    let alias = cnfg.alias || 't';
    let escapeParams = [];
    let pageSize = parseInt(params['x-page-size:']) || 10;
    let startPage = ((parseInt(params['x-start-page:']) - 1) * pageSize || 0) + 1;
    let result = {
      query: '',
      params: []
    };

    let refTableNames = new Map();
    let fields = cnfg.fields;

    _.each(cnfg.fields, (propObj,v) => {

      if (propObj.ref) {
        refTableNames.set(propObj['ref'], propObj);
        result.query += `[${v}].xid as [${v}]`;
      } else if (propObj.expr) {
        result.query += `${propObj.expr} as [${v}]`;
        escapeParams.push(propObj.expr, v);
      } else {
        result.query += `[${alias}].[${propObj['field']}] as ${v}`;
      }

      result.query += ', ';

    });

    if (params['agg:']) {
      result.query = 'SELECT COUNT (*) as cnt';
    } else {
      result.query = 'SELECT TOP ? START AT ? ' + result.query.slice(0, -2);
      result.params.push(pageSize, startPage);
    }

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

    function makePredicate() {

      let withPredicate = false;
      let predicateStr = ` WHERE `;
      let fields = cnfg.fields;

      _.each(fields, (val, key) => {
        if (params && params[key]) {
          if (fields[key].ref) {
            predicateStr += `[${fields[key].ref}].[${fields[key].id}] = ? AND `;
          } else {
            predicateStr += `${alias}.${fields[key].field} = ? AND `;
          }
          result.params.push(params[key]);
          withPredicate = true;
        }
      });

      if (cnfg.predicate) {
        withPredicate = true;
        predicateStr += `${cnfg.predicate} AND `;
      }

      let q = params['q:'];

      if (q) {

        withPredicate = true;

        try {
          let parsed = JSON.parse(q);
          var searchFields = parsed.searchFields;
          var searchFor = parsed.searchFor;
          if (_.isString(searchFields)) {
            searchFields = searchFields.split(',');
          }
          predicateStr += '(' + concatSearchStr(searchFields, searchFor, result.params, cnfg.fields) + ')';
        } catch (err) {
          throw new Error(err);
        }

      }

      if (withPredicate) {
        predicateStr = predicateStr.replace(/ AND $/i, '');
        result.query += predicateStr;
      }
    }

    makePredicate();

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

    return result;
  }

  return makeQuery(config);
};
