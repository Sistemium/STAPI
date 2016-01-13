const _ = require('lodash');

export default function (config, params, domain, pool) {
    "use strict";

    function parseOrderByParams(params, alias) {

        let arr = params.split(',');
        let res = _.reduce(arr, (res, i) => {
            console.log(i);
            if (i[0] === '-') {
                res += `${alias}.${i.slice(1)} DESC`
            } else {
                res += `${alias}.${i}`
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
                let propObj = config[n];
                if (propObj.hasOwnProperty('ref')) {
                    let refConfig = domain.get(`${pool}/${propObj['ref'].toLowerCase()}`);
                    if (!refConfig) {
                        throw new Error('Invalid ref configuration...');
                    } else {
                        parsed[n] = {
                            ref: propObj['ref'],
                            property: n,
                            field: propObj['field'],
                            alias: refConfig['alias'],
                            tableName: refConfig['tableName']
                        };
                    }
                }
                else if (config[n]['field'] && _.isString(config[n]['field'])) {
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

    /**
     *
     * @param cnfg
     * @param {string} tableName
     * @param {string} alias
     * @returns {string} query string
     */
    function makeQuery(cnfg, tableName, alias) {

        let pageSize = parseInt(params['x-page-size:']) || 10;
        let startPage = ((parseInt(params['x-start-page:']) - 1) * pageSize || 0) + 1;

        let query = `SELECT TOP ${pageSize} START AT ${startPage} `;

        if (alias === undefined) {
            alias = 't';
        }
        let refTableNames = new Map();

        _.each(Object.keys(cnfg), (v) => {
            let propObj = cnfg[v];
                console.log(propObj);
            if (_.isObject(propObj)) {
                if (propObj.hasOwnProperty('ref')) {
                    refTableNames.set(propObj['ref'], propObj);
                    query += `[${v}].xid as [${v}]`;
                } else if (propObj.hasOwnProperty('expr')) {
                    query += `${propObj['expr']} as [${v}]`;
                }
            }
            else if (propObj == v) {
                query += `[${alias}].[${propObj}]`;
            } else {
                query += `[${alias}].[${propObj}] as [${v}]`;
            }
            query += ', ';
        });
        query = query.slice(0, -2);
        query += ` FROM ${tableName} as [${alias}]`;
        if (refTableNames.size > 0) {
            for (let ref of refTableNames) {
                query += ` JOIN ${ref[1].tableName} as [${ref[1].property}] on [${ref[1].property}].id = [${alias}].[${ref[1].field}]\n`;
            }
        }
        if (params && params.id) {
            query += ` WHERE ${alias}.xid = '${params.id}'`
        }
        if (params['x-order-by:']) {
            let orderBy = parseOrderByParams(params['x-order-by:'], alias);
            query += ` ORDER BY ${orderBy}`;
        } else {
            //default order by
            if (cnfg['ts'] === 'ts') {
                query += ` ORDER BY ${alias}.${cnfg['ts']} DESC`;
            }
        }

        return query;
    }

    let parsedConfig = parseConfig(config.fields);
    return makeQuery(parsedConfig, config.tableName, config.alias);
};
