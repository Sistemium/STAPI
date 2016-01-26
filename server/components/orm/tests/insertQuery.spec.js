'use strict';

import insertQuery from '../insertQuery';
import registerPlugins from '../../plugins/registerPlugins';
import assert from 'assert';
const domainConfig = require('../../../config/domainConfig');
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
    let writableFields = Object.keys(_.pickBy(config.fields, function (i) {
      return !i.readonly;
    }));
    let query = `MERGE INTO ${config.tableName} AS t USING WITH AUTO NAME (
             SELECT ? AS [code],? AS [xid],(SELECT id FROM [bs].[InventoryBatch] WHERE xid = ?) AS [inventoryBatch]) AS m ON t.[xid] = m.[xid]
            WHEN NOT MATCHED THEN INSERT
            WHEN MATCHED THEN UPDATE`;

    //act
    let result = insertQuery(config, body);

    //assert
    expect(result).to.be.an('object');
    expect(result).to.have.keys(['query', 'params']);
    expect(result.params.length).equal(writableFields.length);
    query = query.replace(/\s/ig, '');
    let queryRegex = new RegExp(RegExp.escape(query), 'gi');
    result.query = result.query.replace(/\s/gi, '');
    let queryMatch = result.query.match(queryRegex) !== null;
    expect(queryMatch).equal(true);
  });
});
