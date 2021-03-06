'use strict';

import _ from 'lodash';

const debug = require('debug')('stapi:orm:selectQuery');

export default function (parameters) {

  let config = parameters.config;
  let params = _.cloneDeep(parameters.params);
  let predicates = _.cloneDeep(parameters.predicates);
  let selectFields = _.cloneDeep(parameters.selectFields);
  let noPaging = !!parameters.noPaging;
  let tableAs = parameters.tableAs;
  let offset = params['x-offset:'];
  let joins = _.cloneDeep(parameters.joins) || config.joins;
  let req = params.req;
  let orderBy;
  let whereOptional = [];

  let groupBy = params['groupBy:'];

  return makeQuery(config);

  function parseOrderByParams(params) {

    let arr = params.split(',');
    let result = _.reduce(arr, (res, i) => {

      let direction = '';
      let colName = i;
      let colPrefix = '';

      if (i[0] === '-') {
        direction = ' DESC';
        colName = i.slice(1);
      }

      let colPrefixMatch = colName.match(/([^.]*)[.](.*)/) || '';

      if (colPrefixMatch) {
        colPrefix = colPrefixMatch[1];
        let refField = _.find(config.fields, { alias: colPrefix });
        if (refField && !refField.fields) {
          colPrefix = `[${colPrefix}].`;
          colName = colPrefixMatch[2];
        } else {
          colPrefix = '';
        }
      }

      res += `${colPrefix}[${colName}]${direction}, `;

      return res;
    }, '');
    result = result.slice(0, -2);
    return result;
  }

  function concatSearchStr(searchFields, searchFor, sqlParams, cfg) {

    let likeStr = '';
    let fields = cfg.fields;

    _.each(searchFields, (field) => {
      //check that passed field is in config
      let fieldConf = fields[field];
      let colPrefixMatch = field.match(/([^.]*)[.](.*)/) || '';
      let alias = colPrefixMatch && colPrefixMatch[1];

      if (!fieldConf && alias) {
        fieldConf = _.find(fields, function (f) {
          return f.alias === alias;
        });
      }

      if (fieldConf) {
        if (alias && fieldConf.ref) {
          likeStr += `[${fieldConf.alias}].[${colPrefixMatch[2]}] LIKE ? OR `;
        } else if (fieldConf.expr && params['agg:']) {
          likeStr += `${fieldConf.expr} LIKE ? OR `;
        } else if (fieldConf.field !== field && params['agg:']) {
          likeStr += `${fieldConf.field} LIKE ? OR `;
        } else {
          likeStr += `[${field}] LIKE ? OR `;
        }
        sqlParams.push(`%${searchFor}%`);
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

    if (params['x-order-by:']) {
      orderBy = parseOrderByParams(params['x-order-by:'], alias);
    }

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
      _.each(cnfg.fields, selectField);
    }

    if (offset) {
      result.query += `[${alias}].id as IDREF, `;
    }

    if (params['agg:']) {
      result.query = 'SELECT COUNT (*) as cnt';
    } else if (groupBy) {

      let groupByList = [];

      let selectGrouped = _.filter(_.map(groupBy.split(','), field => {

        let fieldConfig = config.fields[_.trim(field)];

        if (!fieldConfig) return;

        groupByList.push(`[${field}]`);

        let source = fieldConfig.ref ? `[${fieldConfig.alias}].xid as ` : `${alias}.`;

        if (fieldConfig.expr) {
          source = `${fieldConfig.expr} as `;
        }

        return `${source}[${field}]`;

      }));

      groupBy = groupByList.join(', ');
      orderBy = groupBy;

      result.query = `SELECT ${selectGrouped.join(', ')}, count(*) as [count()] `;

      _.each(cnfg.fields, (field, name) => {

        if (field.ref || name === 'author') return;

        if (field.expr && !field.aggregable) return;

        if (/^decimal|int|integer$/.test(field.type)) {
          result.query += `, sum([${alias}].[${field.field}]) as [sum(${name})]`;
        } else if (/^date|timestamp$/.test(field.type)) {
          result.query += `, max([${alias}].[${field.field}]) as [max(${name})]`;
          result.query += `, min([${alias}].[${field.field}]) as [min(${name})]`;
        }

      });

    } else if (noPaging) {
      result.query = 'SELECT ' + result.query.slice(0, -2);
    } else {
      result.query = 'SELECT TOP ? START AT ? ' + result.query.slice(0, -2);
      result.params.push(pageSize, startPage);
    }

    if (tableName) {

      tableName = tableName.replace(/(\${[^}]*})/g, function (p) {
        let param = p.match(/{([^\?}]*)/)[1];
        if (params[param]) {
          result.params.push(params[param]);
          return `[${param}] = ?`;
        } else if (p.match(/\?}$/)) {
          return '';
        } else {
          throw new Error(`Required parameter missing: "${param}"`);
        }
      });

      result.query += ` FROM ${tableName} as [${alias}]`;
    } else {
      result.query += ` FROM `;
    }

    if (refTableNames.size > 0) {
      //debug('refTableNames', [...refTableNames]);
      for (let ref of refTableNames) {

        const parentIdRef = `[${ref[1].alias}].id`;

        if (ref[1].optional) {
          result.query += ' LEFT';
        }

        let localField = alias + '.[' + ref[1].field + ']';

        if (ref[1].expr) {
          localField = ref[1].expr;
        }

        result.query += ` JOIN ${ref[1].tableName} as [${ref[1].alias}] on ${parentIdRef} = ${localField} `;

        if (ref[1].optional === 'not null') {
          whereOptional.push(`${parentIdRef} is not null or ${localField} is null`);
        }

        //debug('predicatesForJoin', 'predicates:', predicates);
        let predicatesForJoin = _.filter(predicates, (p) => {
          return p.collection === ref[1].alias;
        });

        _.each(predicatesForJoin, (p) => {
          result.query += `AND (${p.field ? `${ref[1].alias}.${escaped(p.field)} ` : ''}${p.sql}) `;
          if (_.isArray(p.params)) {
            Array.prototype.push.apply(result.params, p.params);
          }
        });

        //debug('predicatesForJoin', predicatesForJoin);

      }
    }

    //if join in config
    if (joins) {

      if (!_.isArray(joins)) {
        joins = [joins];
      }

      _.each(joins, join => {

        if (join.collection !== alias) {
          return;
        }

        if (_.isString(join)) {
          join = {
            sql: cnfg.join
          }
        }

        result.query += ` ${join.sql} `;

        if (join.params) {
          Array.prototype.push.apply(result.params, join.params);
        }

      });
    }

    function makePredicate() {

      let withPredicate = false;
      let predicateStr = ` WHERE `;
      let fields = cnfg.fields;

      if (!params) return;

      _.each(params, (value, key) => {

        let field = fields[key];
        let paramAlias = alias;

        debug('makePredicate', field);

        if (!field && key.match(/[.]/)) {

          let match = key.match(/(.*)\.(.*)/);

          paramAlias = match[1];
          field = fields[`${paramAlias}Id`];

          debug('makePredicate dot paramAlias', paramAlias, field);

          if (field) {
            field = field.refConfig.fields[match[2]];
          }

          debug('makePredicate dot ref field', field);

        }

        if (!field) {
          return;
        }

        if (field.ref && params['agg:']) {
          predicateStr += `[${field.alias}].xid`;
        } else if (field.ref) {

          // FIXME won't work sometimes without proper alias

          if (groupBy) {
            predicateStr += `${field.alias}.xid`;
          } else {
            predicateStr += `[${key}]`;
          }

        } else if (field.expr && params['agg:']) {
          predicateStr += `${field.expr}`;
        } else if (field.expr) {
          predicateStr += `[${field.field}]`
        } else {
          predicateStr += `[${paramAlias}].[${field.field}]`;
        }

        if (value === '') {

          predicateStr += ' is null AND ';

        } else if (value.operator === 'between') {

          predicateStr += ` BETWEEN ? AND ? AND `;
          result.params.push(...(value.value || [null, null]));

        } else if (value.operator === 'is') {

          predicateStr += ` ${value.operator} ${value.value} AND `;

        } else if (value.operator) {

          predicateStr += ` ${value.operator} ? AND `;
          result.params.push(value.value);

        } else if (_.isArray(value)) {

          predicateStr += ` in (${_.map(value, () => '?').join()}) AND `;
          Array.prototype.push.apply(result.params, value);
        } else {

          predicateStr += ' = ? AND ';

          if (field.converter) {
            value = field.converter(value, req);
          }

          result.params.push(value);

        }

        withPredicate = true;


      });

      predicates = _.filter(predicates, (p) => {
        return p.collection === alias || typeof p === 'string';
      });

      if (predicates && predicates.length) {

        withPredicate = true;

        _.each(predicates, (pred) => {

          if (pred.field && pred.collection === alias) {

            let predField = fields[pred.field];
            // TODO support pred.dbField
            let predAlias = (predField && predField.field === pred.field && !groupBy) ? '' : (alias + '.');
            predicateStr += `(${predAlias}${escaped(pred.field)} ${pred.sql}) AND `;

          } else if (!pred.field && pred.collection === alias) {
            // or maybe better check for field in modelPredicates
            predicateStr += `${pred.sql} AND `;
          } else {
            predicateStr += `(${pred}) AND `;
          }

          if (_.isArray(pred.params)) {
            Array.prototype.push.apply(result.params, pred.params);
          }

        });

      }

      if (params['q:']) {

        try {

          let { searchFields, searchFor } = params['q:'];

          if (_.isString(searchFields)) {
            withPredicate = true;
            searchFields = searchFields.split(',');
            predicateStr += '(' + concatSearchStr(searchFields, searchFor, result.params, cnfg) + ')';
          }

        } catch (err) {
          throw new Error(err);
        }

      }

      if (whereOptional.length) {
        withPredicate = true;
        predicateStr += `${whereOptional.map(p => `(${p})`).join(' AND ')} AND `;
      }

      if (offset && offset !== '*') {
        try {
          let offsetId = parseInt(offset.match(/[\d]+$/)[0]);
          let offsetTsMatch = offset.match(/.+-(\d{14})(\d{3})-.+/);

          let offsetSeconds = offsetTsMatch[1];
          let offsetMs = offsetTsMatch.length > 2 ? parseInt(offsetTsMatch[2]) : 0;
          let offsetTs = `${offsetSeconds}.${_.padStart(offsetMs, 3, '0')}`;
          let offsetTs1 = `${offsetSeconds}.${_.padStart(offsetMs + 1, 3, '0')}`;

          withPredicate = true;

          predicateStr += `(${alias}.ts > ? AND (${alias}.ts >= ? or ${alias}.id > ?))`;

          Array.prototype.push.apply(result.params, [offsetTs, offsetTs1, offsetId]);

        } catch (e) {
          throw new Error('Wrong offset format: ' + offset);
        }
      }

      if (params.IDREF) {
        withPredicate = true;
        predicateStr += `${alias}.id = ? AND `;
        result.params.push(params.IDREF);
      }

      if (withPredicate) {
        predicateStr = predicateStr.replace(/ AND $/i, '');
        result.query += predicateStr;
      }
    }

    makePredicate();

    groupBy = groupBy || cnfg.groupBy;

    if (groupBy) {
      result.query += ` GROUP BY ${groupBy} `
    }

    if (!params['agg:']) {
      if (orderBy) {
        result.query += ` ORDER BY ${orderBy}`;
      } else {
        //default order by
        let tsField = cnfg.fields['ts'];
        if (tsField && tsField.field === 'ts') {
          if (tsField.expr) {
            result.query += ` ORDER BY ts`;
          } else {
            result.query += ` ORDER BY ${alias}.${cnfg.fields['ts'].field}`;
          }
          if (offset) {
            result.query += ' ASC, IDREF ASC'
          } else {
            result.query += ' DESC'
          }
        }
      }
    }

    return result;
  }

};

function escaped(field) {
  if (/\[.+]/.test(field)) {
    return field;
  }
  return `[${field}]`;
}
