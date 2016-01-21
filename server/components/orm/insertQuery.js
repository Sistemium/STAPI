var _ = require('lodash');

export default function (body, config) {
  "use strict";

  let fields = {};
  let result = {
    query: '',
    params: []
  };

  _.each(Object.keys(body), (k) => {
    let cnfProp = config['fields'][k];
    if (_.isObject(cnfProp)) {
      if (cnfProp['readonly'] || cnfProp['expr']) {
        return;
      }

      if (cnfProp) {
        if (_.isString(cnfProp['ref'])) {
          fields[cnfProp['field']] = {
            body: body[k],
            ref: {
              tableName: cnfProp.ref.tableName
            }
          };
        }
        else if (_.isString(cnfProp['field'])) {
          if (cnfProp.hasOwnProperty('type')) {
            if (cnfProp.type.match(/^(bool|boolean)$/i)) {
              body[k] = body[k] === true ? '1' : '0';
            }
          }
          fields[cnfProp['field']] = body[k];
        }
        else {
          console.log(cnfProp);
          throw new Error('Field must be a string');
        }
      }
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
