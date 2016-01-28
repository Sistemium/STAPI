'use strict';

import insertQuery from '../insertQuery';
import registerPlugins from '../../plugins/registerPlugins';
import assert from 'assert';
const domainConfig = require('../domainConfigsParser');
const path = require('path');
const _ = require('lodash');

RegExp.escape = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

describe('Create insert query', function () {
  let map;
  before(function (done) {

    domainConfig(path.normalize(path.join(__dirname, '../../..', 'domain')), (m) => {
      map = m;
      done();
    });
  });

  it('should create insert query', () => {
    //arrange
    let body = {
      "code": "22N00001545RJN0891A37ZP51102002114882BU9QDF076KXHP6K49T3B60O41FF3SMJ",
      "cts": "2016-01-08 12:57:12.385",
      "id": "9361f73e-2ab5-4edb-ac91-8c7d14e9533f",
      "inventoryBatch": "8703ca1e-420b-4dc3-8a2c-50932bd2ab3b",
      "ts": "2016-01-08 12:57:12.334"
    };

    let config = map.get('dev/inventorybatchitem');

    //act
    let result = insertQuery(config, body);

    //assert
    expect(result).to.be.an('object');
    expect(result).to.have.keys(['query', 'params']);
  });

  it('should create query with predicates', () => {

    let body = {

    }

  })
});
