'use strict';

const autoLoad = require('auto-load');
const _ = require('lodash');

module.exports = function (path, options) {
    let tree = autoLoad(path, options);
    let map = new Map();
    _.each(tree, (val, key) => {
        if (!val.pools || val.pools.length === 0) {
            throw new Error(`Incorrect pools configuration in file ${key}.js...`);
        }

        if (!val.collection) {
            throw new Error(`Collection property in config file ${key}.js should be set...`);
        }

        if (val.pools.length > 1) {
            _.each(val.pools, (v) => {
                map.set(`${v}/${val.collection.toLowerCase()}`, val);
            });
        } else {
            map.set(`${val.pools[0]}/${val.collection.toLowerCase()}`, val);
        }
    });

    return map;
};
