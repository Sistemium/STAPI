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

    let refAlias;
    _.each(fields, (v, k) => {
      if (v && v.ref) {
        result.query += `(SELECT id FROM ${v.ref.tableName} WHERE xid = ?) AS [${k}],`;
        refAlias = k;
        result.params.push(v.body);
      }
      else {
        result.query += `? AS [${k}],`;
        result.params.push(v);
      }
    });

    result.query = result.query.slice(0, -1);
    result.query +=
      `) AS m ON t.[xid] = m.[xid]
            WHEN NOT MATCHED AND m.${refAlias} IS NULL THEN INSERT
            WHEN MATCHED AND m.${refAlias} IS NULL THEN UPDATE`;

    return result;
  }

  return concatQuery(fields, config);
}
