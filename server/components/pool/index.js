'use strict';

import connections from '../../config/sqlanywhere/connectionParams';
import PoolsManager from './poolManager';

const poolManager = new PoolsManager();

poolManager.initPools(connections);

export {getPoolByName, getPoolsKeys};

function getPoolByName(name) {
  return poolManager.getPoolByName(name);
}

function getPoolsKeys() {
  return poolManager.getPoolsKeys();
}
