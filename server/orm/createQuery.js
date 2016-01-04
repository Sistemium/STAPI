var _ = require('lodash');

module.exports = function (config) {
    "use strict";

    function parseConfig(config) {
        let parsed = {};
        if (!_.isObject(config)) throw new Error('Model definition should be an object');
        _.each(Object.keys(config), (n) => {
            if (_.isString(config[n])) {
                parsed[n] = config[n];
            } else if (_.isObject(config[n])) {
                if (config[n]['field'] && _.isString(config[n]['field'])) {
                    parsed[n] = config[n]['field'];
                } else if (config[n]['expr']) {
                    parsed[n] = {expr: config[n]['expr']};
                }
                else {
                    throw new Error('Invalid model definition');
                }
            } else {
                throw new Error('Invalid model definition');
            }
        });

        return parsed;
    }

    function makeQuery(cnfg, tableName) {
        let query = 'SELECT ';
        _.each(Object.keys(cnfg), (v) => {
            if (_.isObject(cnfg[v])) {
                query += `${cnfg[v]['expr']} as [${v}],`;
            }
            else if (cnfg[v] == v) {
                query += `${cnfg[v]},`;
            } else {
                query += `${cnfg[v]} as [${v}],`;
            }
        });
        query = query.slice(0, -1);
        query += ` FROM ${tableName}`;
        return query;
    }

    let parsedConfig = parseConfig(config.fields);
    return makeQuery(parsedConfig, config.tableName);
};
