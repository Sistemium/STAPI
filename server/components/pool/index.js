'use strict';

const connections = require('../../config/sqlanywhere/connectionParams');
const poolManager = require('./poolManager');
poolManager.initPools(connections);

export default function (name) {
  return getPoolByName(name);
}

export function getPoolByName (name) {
  return  poolManager.getPoolByName(name);
}

export function getPoolsKeys () {
  return poolManager.getPoolsKeys();
}
