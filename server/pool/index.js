'use strict';

const connections = require('./../config/sqlanywhere/connectionParams');
const poolManager = require('./poolManager');
poolManager.initPools(connections);

module.exports = function (name) {
    return poolManager.getPoolByName(name);
};
