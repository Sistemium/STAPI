import _ from 'lodash';
import selectQuery from './selectQuery';
const debug = require('debug')('stapi:orm:insertQuery');

export default function (config, body, predicates, poolConfig, joins) {

  let fields = {};
  let result = {
    query: '',
    params: []
  };

  //debug('body', body);

  _.each(body, (val, k) => {

    let cnfProp = config.fields [k];

    if (cnfProp.ref && !(cnfProp.insertRaw || cnfProp.converter)) {
      let field = _.pick(cnfProp, ['refConfig', 'optional']);
      field.body = val;
      fields[cnfProp.field] = field;
    } else {
      fields[cnfProp.field] = val;
    }

  });

  function concatQuery(fields, config) {

    let queryAlias = config.alias === 'm' ? 'n' : 'm';
    let refAliases = [];
    let immutables = [];

    result.query =
      `MERGE INTO ${config.tableName} AS [${config.alias}] USING WITH AUTO NAME (
             SELECT `;


    debug('concatQuery:fields', fields);


    _.each(fields, (field, fieldKey) => {

      if (field && field.refConfig) {

        let refPredicates = _.filter(predicates, (p) => {
          return !p.sameCollection && p.collection === fieldKey;
        });

        result.params.push(field.body);

        refPredicates = _.map(refPredicates, (rp) => {
          if (rp.params) {
            Array.prototype.push.apply(result.params,rp.params);
          }
          return `${rp.field || ''} ${rp.sql}`;
        });

        refPredicates = refPredicates.join(' AND ');
        result.query += `(
          SELECT id FROM ${field.refConfig.tableName} as [${fieldKey}] 
          WHERE xid = ? ${refPredicates && ` AND ${refPredicates}`}
        ) AS [${fieldKey}],`;

        if (!field.optional || field.body) {
          refAliases.push(`${queryAlias}.${fieldKey}`);
        }

      } else {

        result.query += `? AS [${fieldKey}],`;
        result.params.push(field);

        if (_.get(config.fields[fieldKey],'immutable')) {
          immutables.push(`${queryAlias}.${fieldKey} = ${config.alias}.${fieldKey}`);
        }

      }

    });

    result.query = result.query.slice(0, -1);

    var refAliasesString = refAliases.join(' IS NOT NULL AND ');
    var immutablesString = immutables.join(' AND ');

    if (immutablesString) {
      immutablesString = `WHEN MATCHED AND not (${immutablesString}) THEN RAISERROR 70002`;
    }

    // debug('all predicates', predicates);

    let tPredicates = _.filter(predicates, (p) => {
      return p.collection === config.alias || typeof p === 'string';
    });

    debug('applied predicates', tPredicates);

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
            ${immutablesString} 
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
