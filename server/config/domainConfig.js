'use strict';

const autoLoad = require('auto-load');
const _ = require('lodash');

module.exports = function (path, options) {
    let tree = autoLoad(path, options);
    let map = new Map();
    _.each(tree, (val, key) => {
        if (!val.pools || val.pools.length === 0) {
            throw new Error(`Incorrect pools configuration in file ${key}.js`);
        }

        if (val.pools.length > 1) {
            _.each(val.pools, (v) => {
                map.set(`${v}/${val.alias.toLowerCase()}`, val);
            });
        } else {
            map.set(`${val.pools[0]}/${val.alias.toLowerCase()}`, val);
        }
    });

    return map;
};
