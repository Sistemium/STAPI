var _ = require('lodash');
const debug = require('debug')('stapi:orm:insertQuery');
import selectQuery from './selectQuery';

export default function (config, body, predicates, poolConfig, joins) {
  "use strict";

  let fields = {};
  let result = {
    query: '',
    params: []
  };

  //debug('body', body);

  _.each(body, (val, k) => {

    let cnfProp = config.fields [k];

    if (cnfProp.ref && !cnfProp.insertRaw) {
      fields[cnfProp.field] = {
        body: val,
        refConfig: cnfProp.refConfig,
        optional: cnfProp.optional
      };
    } else {
      fields[cnfProp.field] = val;
    }

  });

  function concatQuery(fields, config) {
    let queryAlias = config.alias === 'm' ? 'n' : 'm';
    result.query =
      `MERGE INTO ${config.tableName} AS [${config.alias}] USING WITH AUTO NAME (
             SELECT `;

    let refAliases = [];

    debug('concatQuery:fields', fields);
    _.each(fields, (v, k) => {
      if (v && v.refConfig) {

        let refPredicates = _.filter(predicates, (p) => {
          return p.collection === k;
        });

        result.params.push(v.body);

        refPredicates = _.map(refPredicates, (rp) => {
          if (rp.params) {
            Array.prototype.push.apply(result.params,rp.params);
          }
          return `${rp.field || ''} ${rp.sql}`;
        });

        refPredicates = refPredicates.join(' AND ');
        result.query += `(
          SELECT id FROM ${v.refConfig.tableName} as [${k}] 
          WHERE xid = ? ${refPredicates && ` AND ${refPredicates}`}
        ) AS [${k}],`;

        if (!v.optional || v.body) {
          refAliases.push(`${queryAlias}.` + k);
        }

      }
      else {
        result.query += `? AS [${k}],`;
        result.params.push(v);
      }
    });

    result.query = result.query.slice(0, -1);
    var refAliasesString = refAliases.join(' IS NOT NULL AND ');

    debug('tPredicates', predicates);

    let tPredicates = _.filter(predicates, (p) => {
      return p.collection === config.alias || typeof p === 'string';
    });

    debug('tPredicates', tPredicates);
    tPredicates = _.map(tPredicates, (tp) => {
      if (tp.params) {
        Array.prototype.push.apply(result.params,tp.params);
      }
      return tp.field ? `[${config.alias}].[${tp.field}] ${tp.sql}` : `${tp.sql || (tp)}`;
    });
    tPredicates = tPredicates.join(' AND ');

    result.query +=
      `) AS ${queryAlias} ON ${config.alias}.[xid] = ${queryAlias}.[xid]
            WHEN NOT MATCHED ${refAliasesString && `AND ${refAliasesString} IS NOT NULL`} THEN INSERT
            ${refAliasesString && `WHEN NOT MATCHED THEN RAISERROR 70001`}
            ${tPredicates && `WHEN MATCHED AND NOT (${tPredicates}) THEN RAISERROR 70002`}
            WHEN MATCHED ${refAliasesString && `AND ${refAliasesString} IS NOT NULL`} THEN UPDATE
            ${refAliasesString && `WHEN MATCHED THEN RAISERROR 70001`}
    `;

    if (config.selectFromMerge || poolConfig.selectFromMerge) {
      let params = {
        config: config,
        params: {},
        tableAs: `(select * from (${result.query}) referencing (final as inserted))`,
        noPaging: true,
        joins: joins
      };
      let sq = selectQuery(params);
      result.query = sq.query;
      result.params = result.params.concat(sq.params);
    }

    return result;
  }

  return concatQuery(fields, config);
}
