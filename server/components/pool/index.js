'use strict';

const connections = require('../../config/sqlanywhere/connectionParams');
import poolManager from './poolManager';
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
