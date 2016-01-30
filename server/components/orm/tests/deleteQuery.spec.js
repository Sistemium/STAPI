'use strict';

import deleteQuery from '../deleteQuery';
import domainConfigsParser from '../domainConfigsParser';
import registerPlugins from '../../plugins/registerPlugins';

import config from '../../../config/environment';
import assert from 'assert';
import path from 'path';

describe('delete query', () => {
  let map;
  before((done) => {
    domainConfigsParser(path.normalize(path.join(config.root, process.env.ST_COLLECTIONS)), (m) => {
      map = m;
      done();
    });
  });

  it('should create delete query', () => {

    //arrange
    let config = map.get('pha/account');
    let id = '256785ac-5c80-11e5-8000-845155c0f131';

    //act
    let result = deleteQuery(config, id);

    //assert
    expect(result).to.be.an('object');
    expect(result).to.have.keys(['query', 'params']);

  });
});
