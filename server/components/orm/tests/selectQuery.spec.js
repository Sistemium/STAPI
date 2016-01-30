'use strict';

const selectQuery = require('../selectQuery');
const assert = require('assert');
const domainConfig = require('../domainConfigsParser');
const registerPlugins = require('../../plugins/registerPlugins');
const path = require('path');
import config from '../../../config/environment';

RegExp.escape = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

describe('Create select query', () => {
  let map;
  before(function (done) {
    domainConfig(path.join(config.root, process.env.ST_COLLECTIONS), (m) => {
      map = m;
      done();
    });
  });


  it('should create query', () => {
    //arrange
    let config = map.get('dev/stg.shipmentroutepoint');
    let params = {
      '@shipmentRoute': 1172
    };
    //act
    let res = selectQuery(config, params);

    //assert
    expect(res).to.be.an('object');
    expect(res).to.have.keys(['query', 'params']);
  });

  it('should create query with predicate, if field names passed', () => {
    //arrange
    let config = map.get('dev/inventorybatch');
    let params = {
      isDone: true
    };

    //act
    let res = selectQuery(config, params);

    //assert
    expect(res).to.be.an('object');
    expect(res).to.have.keys(['query', 'params']);
    console.log(res.params);
    let paramPredicateRegex = new RegExp(RegExp.escape(`WHERE ${config.alias}.isDone = ? `), 'i');
    let paramPredicateExist = res.query.match(paramPredicateRegex) ? true : false;
    expect(paramPredicateExist).equal(true);
    let configJoinRegex = new RegExp(RegExp.escape(config.join), 'i');
    let configJoinExist = res.query.match(configJoinRegex) ? true : false;
    expect(configJoinExist).equal(true);
    expect(res.params).to.be.an('array');
    expect(res.params.length).equal(3);
    expect(res.params[2]).equal(1);
  });
});
