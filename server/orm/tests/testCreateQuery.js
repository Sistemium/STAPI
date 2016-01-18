'use strict';

const selectQuery = require('../selectQuery');
const config = require('../../domain/agent/oneMoreLevel/agent');
const assert = require('assert');

describe('Create query', function () {
  it('should create query', function () {
    let res = selectQuery(config);
    expect(res).toBeA(string);
  })
});
