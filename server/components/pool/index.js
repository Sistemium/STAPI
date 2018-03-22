'use strict';

import connections from '../../config/sqlanywhere/connectionParams';
import PoolsManager from './poolManager';

const poolManager = new PoolsManager();

poolManager.initPools(connections);

export default function (name) {
  return getPoolByName(name);
}

export function getPoolByName(name) {
  return poolManager.getPoolByName(name);
}

export function getPoolsKeys() {
  return poolManager.getPoolsKeys();
}
