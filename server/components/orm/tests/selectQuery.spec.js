'use strict';

const selectQuery = require('../selectQuery');
const assert = require('assert');
const domainConfig = require('../../../config/domainConfig');
const path = require('path');

RegExp.escape = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

describe('Create query', () => {
  let map;
  before(function (done) {
    domainConfig(path.join(__dirname, 'testDomain'), (m) => {
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
    let itemsExprRegex = new RegExp(RegExp.escape(config.fields.items.expr), 'i');
    let itemsExprExist = res.query.match(itemsExprRegex) ? true : false;
    expect(itemsExprExist).equal(true);
    console.log(res.params);
    let paramPredicateRegex = new RegExp(RegExp.escape(`WHERE ${config.alias}.isDone = ? `), 'i');
    let paramPredicateExist = res.query.match(paramPredicateRegex) ? true : false;
    expect(paramPredicateExist).equal(true);
    let configJoinRegex = new RegExp(RegExp.escape(config.join), 'i');
    let configJoinExist = res.query.match(configJoinRegex) ? true : false;
    expect(configJoinExist).equal(true);
    let configPredicateRegex = new RegExp(RegExp.escape(config.predicate), 'i');
    let configPredicateExist = res.query.match(configPredicateRegex) ? true : false;
    expect(configPredicateExist).equal(true);
    expect(res.params).to.be.an('array');
    expect(res.params.length).equal(3);
    expect(res.params[2]).equal('1');
  });

});
