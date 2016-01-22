'use strict';
const Pool = require('./pool');
const _ = require('lodash');
var pools = {};

class PoolsManager {

  initPools(connections) {
    _.each(connections, (o) => {
      pools[o.name] = new Pool(o).createPool();
    });
  }

  getPoolByName(name) {
    return pools[name];
  }
}


export default new PoolsManager();
