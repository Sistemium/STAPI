'use strict';

import Pool from './pool';
import _ from 'lodash';

const pools = {};

class PoolsManager {

  initPools(connections) {
    _.each(connections, (o) => {
      pools[o.name] = new Pool(o).createPool();
    });
  }

  getPoolByName(name) {
    return pools[name];
  }

  getPoolsKeys() {
    return Object.keys(pools);
  }

}


export default new PoolsManager();
