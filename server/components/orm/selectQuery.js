'use strict';

const _ = require('lodash');
const debug = require('debug')('stapi:orm:selectQuery');

export default function (parameters) {
  var config = parameters.config;
  var params = _.cloneDeep (parameters.params);
  var predicates = _.cloneDeep (parameters.predicates);
  var selectFields = _.cloneDeep (parameters.selectFields);
  var noPaging = !!parameters.noPaging;
  var tableAs = parameters.tableAs;

  function parseOrderByParams(params) {

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

    let tableName = tableAs || cnfg.selectFrom;
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

    function selectField(prop, key) {
      if (prop.ref || prop.fields) {

        if (prop.ref) {
          refTableNames.set(prop.alias, prop);
        }

        let fields = prop.fields;

        if (!fields) {
          result.query += `[${prop.alias || key}].xid as [${key}]`;
        } else {
          _.each(fields, function (refField, refProp) {
            result.query += `[${prop.alias || key}].[${refField.field}] as [${key}.${refProp}], `;
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
    }

    if (selectFields) {
      _.each(selectFields, (field) => {
        let configKeys = Object.keys(fields);
        let keyIndex = configKeys.indexOf(field);
        if (keyIndex >= 0) {
          let key = configKeys[keyIndex];
          let prop = fields[key];
          selectField(prop, key);
        } else {
          throw new Error(`Select field "${field}" not defined in config`);
        }
      });
    } else {

      _.each(cnfg.fields, (prop, key) => {

        selectField(prop, key);

      });
    }

    if (params['agg:']) {
      result.query = 'SELECT COUNT (*) as cnt';
    } else if (noPaging){
      result.query = 'SELECT ' + result.query.slice(0, -2);
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
      //debug('refTableNames', [...refTableNames]);
      for (let ref of refTableNames) {
        if (ref[1].optional) {
          result.query += ' LEFT';
        }
        result.query += ` JOIN ${ref[1].tableName} as [${ref[1].alias}] on [${ref[1].alias}].id = ${alias}.${ref[1].field} `;
        //debug('predicatesForJoin', 'predicates:', predicates);
        let predicatesForJoin = _.filter(predicates, (p) => {
          return p.collection === ref[1].alias;
        });
        _.each(predicatesForJoin, (p) => {
          result.query += `AND (${p.field ? `${ref[1].alias}.${p.field} ` : ''}${p.sql}) `
        });
        //debug('predicatesForJoin', predicatesForJoin);
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
            predicateStr += `[${key}].[${field.id}] = ? AND `;
          } else {
            predicateStr += `${alias}.${field.field} = ? AND `;
          }
          if (field.converter) {
            params[key] = field.converter(params[key]);
          }
          result.params.push(params[key]);
          withPredicate = true;
        }
      });

      predicates = _.filter(predicates, (p) => {
        return p.collection === alias || typeof p === 'string';
      });
      if (predicates && predicates.length) {
        withPredicate = true;
        _.each(predicates, (pred) => {
          if (pred.field && pred.collection === alias) {
            let predAlias = fields[pred.field] ? '' : (alias + '.');
            predicateStr += `(${predAlias}${pred.field} ${pred.sql}) AND `;
          }
          // or maybe better check for field in modelPredicates
          else if (!pred.field && pred.collection === alias) {
            predicateStr += `${pred.sql} AND `;
          }
          else {
            predicateStr += `(${pred}) AND `;
          }
        });
      }

      let q = params['q:'];

      if (q) {

        withPredicate = true;

        try {
          var searchFields = q.searchFields;
          var searchFor = q.searchFor;
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
