var _ = require('lodash');
const debug = require('debug')('stapi:orm:insertQuery');

export default function (config, body) {
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
        ref: {
          tableName: cnfProp.tableName
        }
      };
    } else {
      fields[cnfProp.field] = val;
    }

  });

  function concatQuery(fields, config) {

    result.query =
      `MERGE INTO ${config.tableName} AS t USING WITH AUTO NAME (
             SELECT `;

    let refAliases = [];
    _.each(fields, (v, k) => {
      if (v && v.ref) {
        result.query += `(SELECT id FROM ${v.ref.tableName} WHERE xid = ?) AS [${k}],`;
        refAliases.push('m.' + k);
        result.params.push(v.body);
      }
      else {
        result.query += `? AS [${k}],`;
        result.params.push(v);
      }
    });

    result.query = result.query.slice(0, -1);
    refAliases = refAliases.join(' AND ');
    result.query +=
      `) AS m ON t.[xid] = m.[xid]
            ${refAliases.length > 0 ? `WHEN NOT MATCHED AND ${refAliases} IS NULL THEN RAISERROR` : ''}
            WHEN NOT MATCHED THEN INSERT
            ${refAliases.length > 0 ? `WHEN MATCHED AND ${refAliases} IS NULL THEN RAISERROR` : ''}
            WHEN MATCHED THEN UPDATE`;

    return result;
  }

  return concatQuery(fields, config);
}
