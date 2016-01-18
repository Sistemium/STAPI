var _ = require('lodash');

export default function (body, config, map, pool) {
    "use strict";

    let fields = {};
    let result = {
        query: '',
        params: []
    };

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
        if (_.isObject(cnfProp)) {
            if (cnfProp['readonly'] || cnfProp['expr']) {
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
                result.params.push(`${v}`);
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
