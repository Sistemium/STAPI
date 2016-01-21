'use strict';

const selectQuery = require('../selectQuery');
const config = require('../../../domain/inventoryBatch/inventoryBatchItem');
const assert = require('assert');

describe('Create query', function () {
  it('should create query', function () {
    let res = selectQuery(config, params, map, pool);
    expect(res).toBeA(string);
  })
});
