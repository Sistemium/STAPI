var _ = require('lodash');

export default function (body, config, map, pool) {
    "use strict";

    var fields = {};

    function mapModelKeysToFields(config) {
        let map = new Map();

        _.each(config['fields'], (val, key) => {
            if (_.isObject(val)) {
                if (val.hasOwnProperty('field') && _.isString(val['field'])) {
                    map.set(key, val['field']);
                } else {
                    throw new Error('Invalid model definition, check your configuration...');
                }
            } else if (_.isString(val)) {
                map.set(key, val);
            } else {
                throw new Error('Invalid model definition, check your configuration...');
            }
        });

        return map;
    }

    _.each(Object.keys(body), (k) => {
        let cnfProp = config['fields'][k];
        if (_.isString(cnfProp)) {
            fields[cnfProp] = body[k];
        }
        else if (_.isObject(cnfProp)) {
            if (cnfProp['readonly']) {
                return;
            }

            if (cnfProp) {
                if (_.isString(cnfProp['ref'])) {
                    fields[cnfProp['field']] = {
                        body: body[k],
                        ref: map.get(`${pool}/${cnfProp['ref'].toLowerCase()}`)
                    };
                }
                else if (_.isString(cnfProp['field'])) {
                    fields[cnfProp['field']] = body[k];
                }
                else {
                    throw new Error('Field must be a string');
                }
            }
        }
    });

    function concatQuery(fields, config) {
        let query =
            `MERGE INTO ${config.tableName} AS t USING WITH AUTO NAME (
             SELECT `;

        _.each(fields, (v, k) => {
            if (_.isObject(fields[k])) {
                query += `(SELECT id FROM ${fields[k].ref.tableName} WHERE xid = '${fields[k].body}') AS [${k}],`;
            }
            else if (v === null) {
                query += `${v} AS [${k}],`
            } else {
                query += `'${v}' AS [${k}],`
            }
        });
        query = query.slice(0, -1);
        query +=
            `) AS m ON t.[xid] = m.[xid]
            WHEN NOT MATCHED THEN INSERT
            WHEN MATCHED THEN UPDATE`;
        return query;
    }

    return concatQuery(fields, config);
}
