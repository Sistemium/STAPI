var _ = require('lodash');
const debug = require('debug')('stapi:orm:insertQuery');

export default function (config, body, predicates) {
  "use strict";

  let fields = {};
  let result = {
    query: '',
    params: []
  };

  _.each(body, (val,k) => {

    let cnfProp = config.fields [k];

    //if (!cnfProp || cnfProp.readonly) {
    //  return true;
    //}

    if (cnfProp.ref && !cnfProp.insertRaw) {
      fields[cnfProp.field] = {
        body: val,
        refConfig: cnfProp.refConfig
      };
    } else {
      fields[cnfProp.field] = val;
    }

  });

  function concatQuery(fields, config) {
    //check that config alias not matches queryAlias
    let queryAlias = 'm';
    result.query =
      `MERGE INTO ${config.tableName} AS ${config.alias} USING WITH AUTO NAME (
             SELECT `;

    let refAliases = [];

    //debug('fields', fields);
    _.each(fields, (v, k) => {
      if (v && v.refConfig) {
        let refPredicates = _.filter(predicates, (p) => {
          return p.collection === v.refConfig.collection;
        });
        refPredicates = _.map(refPredicates, (rp) => {
          return `${rp.field || ''} ${rp.sql}`;
        });
        refPredicates = refPredicates.join(' AND ');
        result.query += `(SELECT id FROM ${v.refConfig.tableName} as [${k}] WHERE xid = ? ${refPredicates && ` AND ${refPredicates}`}) AS [${k}],`;
        refAliases.push(`${queryAlias}.` + k);
        result.params.push(v.body);
      }
      else {
        result.query += `? AS [${k}],`;
        result.params.push(v);
      }
    });

    result.query = result.query.slice(0, -1);
    refAliases = refAliases.join(' IS NOT NULL AND ');

    let tPredicates = _.filter(predicates, (p) => {
      return p.collection === config.collection || typeof p === 'string';
    });
    //debug('tPredicates', tPredicates);
    tPredicates = _.map(tPredicates, (tp) => {
      if (typeof tp === 'string') {
        return tp;
      } else {
        return `${tp.field || ''} ${tp.sql}`
      }
    });
    tPredicates = tPredicates.join(' AND ');

    result.query +=
      `) AS ${queryAlias} ON ${config.alias}.[xid] = ${queryAlias}.[xid]
            WHEN NOT MATCHED ${refAliases && `AND ${refAliases} IS NOT NULL`} THEN INSERT
            ${refAliases && `WHEN NOT MATCHED THEN RAISERROR 70001`}
            ${tPredicates && `WHEN MATCHED AND NOT (${tPredicates}) THEN RAISERROR 70002`}
            WHEN MATCHED ${refAliases && `AND ${refAliases} IS NOT NULL`} THEN UPDATE
            ${refAliases && `WHEN MATCHED THEN RAISERROR 70001`}
    `;

    return result;
  }

  return concatQuery(fields, config);
}
