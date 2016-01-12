var _ = require('lodash');

export default function (config,params) {
    "use strict";

    function parseOrderByParams(table, params) {

        let arr = params.split(',');
        let res = _.reduce(arr, (res, i) => {
            console.log(i);
            if (i[0] === '-') {
                res += `${table}.${i.slice(1)} DESC`
            } else {
                res += `${table}.${i}`
            }
            res += ', ';
            return res;
        }, '');
        return res.slice(0, -2);
    }

    function parseConfig(config) {
        let parsed = {};
        if (!_.isObject(config)) throw new Error('Model definition must be an object');
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

    function makeQuery(cnfg, tableName, alias) {

        let pageSize = parseInt (params['x-page-size:']) || 10;
        let startPage = ((parseInt (params['x-start-page:']) - 1) * pageSize || 0) + 1;

        let query = `SELECT TOP ${pageSize} START AT ${startPage} `;

        _.each(Object.keys(cnfg), (v) => {
            if (_.isObject(cnfg[v])) {
                query += `${cnfg[v]['expr']} as [${v}]`;
            }
            else if (cnfg[v] == v) {
                query += `[${alias}].[${cnfg[v]}]`;
            } else {
                query += `[${alias}].[${cnfg[v]}] as [${v}]`;
            }
            query += ', ';
        });
        query = query.slice(0, -2);
        query += ` FROM ${tableName}`;
        if (params && params.id) {
            query += ` WHERE ${tableName}.xid = '${params.id}'`
        }
        if (params['x-order-by:']) {
            let orderBy = parseOrderByParams(tableName, params['x-order-by:']);
            query += ` ORDER BY ${orderBy}`;
        } else {
            //default order by
            if (cnfg['ts'] === 'ts') {
                query += ` ORDER BY ${tableName}.${cnfg['ts']} DESC`;
            }
        }

        return query;
    }

    let parsedConfig = parseConfig(config.fields);
    return makeQuery(parsedConfig, config.tableName, config.alias);
};
