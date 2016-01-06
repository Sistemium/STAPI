var _ = require('lodash');

export default function (body, config) {
    "use strict";

    var fields = {};

    _.each(Object.keys(body), (k) => {
        if (_.isString(config['fields'][k])) {
            fields[config['fields'][k]] = body[k];
        }
        else if (_.isObject(config['fields'][k])) {
            if (config['fields'][k]['readonly']) {
                return;
            }
            if (config['fields'][k]['field']) {
                if (_.isString(config['fields'][k]['field'])) {
                    fields[config['fields'][k]['field']] = body[k];
                }
                else {
                    throw new Error('Field not a string');
                }
            }
        }
    });

    function concatQuery(fields, config) {
        let query =
            `MERGE INTO ${config.tableName} AS t USING WITH AUTO NAME (
             SELECT `;
        _.each(fields, (v, k) => {
            if (v === null) {
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
