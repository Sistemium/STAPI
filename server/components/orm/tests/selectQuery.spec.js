'use strict';

const selectQuery = require('../selectQuery');
const assert = require('assert');
const domainConfig = require('../../../config/domainConfig');
const path = require('path');


describe('Create query', function () {
  let config;
  before(function (done) {
    domainConfig(path.join(__dirname, 'testDomain'), (m) => {
      config = m.get('dev/stg.shipmentroutepoint');
      done();
    });
  });

  it('should create query', function () {
    let params = {
      '@shipmentRoute': 1172
    };
    let res = selectQuery(config, params);
    expect(res).to.be.an('object');
    expect(res).to.have.keys(['query', 'params']);
  });
});
