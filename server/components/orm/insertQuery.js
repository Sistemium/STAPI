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

    if (!cnfProp || cnfProp.readonly || cnfProp.expr) {
      return true;
    }

    if (cnfProp.ref) {
      fields[cnfProp.field] = {
        body: val,
        ref: {
          tableName: cnfProp.tableName
        }
      };
    } else {
      if (cnfProp.type && cnfProp.type.match(/^(bool|boolean)$/i)) {
        val = (val === '0' || !val) ? 0 : 1;
      }
      fields[cnfProp.field] = val;
    }

  });

  function concatQuery(fields, config) {

    result.query =
      `MERGE INTO ${config.tableName} AS t USING WITH AUTO NAME (
             SELECT `;

    _.each(fields, (v, k) => {
      if (_.isObject(fields[k])) {
        result.query += `(SELECT id FROM ${fields[k].ref.tableName} WHERE xid = ?) AS [${k}],`;
        result.params.push(fields[k].body);
      }
      else {
        result.query += `? AS [${k}],`;
        result.params.push(v);
      }
    });

    result.query = result.query.slice(0, -1);
    result.query +=
      `) AS m ON t.[xid] = m.[xid]
            WHEN NOT MATCHED THEN INSERT
            WHEN MATCHED THEN UPDATE`;

    return result;
  }

  return concatQuery(fields, config);
}
