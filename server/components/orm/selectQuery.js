const _ = require('lodash');
const debug = require('debug')('stapi:orm:selectQuery');

export default function (config, params) {
  "use strict";

  function parseOrderByParams(params, alias) {

    let arr = params.split(',');
    let result = _.reduce(arr, (res, i) => {
      if (i[0] === '-') {
        res += `[${i.slice(1)}] DESC`;
      } else {
        res += `[${i}]`;
      }
      res += ', ';
      return res;
    }, '');
    result = result.slice(0, -2);
    return result;
  }

  function concatSearchStr(searchFields, searchFor, params, cfg) {

    let likeStr = '';
    let fields = cfg.fields;

    _.each(searchFields, (field) => {
      //check that passed field is in config
      if (fields[field]) {
        likeStr += `${cfg.alias}.${fields[field].field} LIKE ? OR `;
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
    let alias = cnfg.alias;
    let escapeParams = [];
    let pageSize = parseInt(params['x-page-size:']) || 10;
    let startPage = ((parseInt(params['x-start-page:']) - 1) * pageSize || 0) + 1;
    let result = {
      query: '',
      params: []
    };

    let refTableNames = new Map();
    let fields = cnfg.fields;

    _.each(cnfg.fields, (prop,key) => {

      if (prop.ref) {
        refTableNames.set(prop.ref, prop);
        let fields = prop.fields;
        if (!fields) {
          result.query += `[${key}].xid as [${key}]`;
        } else {
          _.each(fields,function(refField, refProp){
            result.query += `[${key}].[${refField}] as [${key}.${refProp}], `;
          });
          result.query = result.query.slice(0, -2);
        }
      } else if (prop.expr) {
        result.query += `${prop.expr} as [${key}]`;
        escapeParams.push(prop.expr, key);
      } else {
        result.query += `[${alias}].[${prop.field}] as [${key}]`;
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

      _.each(fields, (field, key) => {
        if (params && params[key]) {
          if (field.ref) {
            predicateStr += `[${field.ref}].[${field.id}] = ? AND `;
          } else {
            predicateStr += `${alias}.${field.field} = ? AND `;
          }
          //TODO: make converters for fields with type boolean
          if (field.type && field.type.match(/^(bool|boolean)$/i)) {
            params[key] = params[key] ? '1':'0';
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
          predicateStr += '(' + concatSearchStr(searchFields, searchFor, result.params, cnfg) + ')';
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
