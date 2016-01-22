'use strict';

import insertQuery from '../insertQuery';
import assert from 'assert';
import domainConfig from '../../../config/domainConfig';
import path from 'path';

describe('Create insert query', function () {
  let map;
  before(function (done) {
    domainConfig(path.join(__dirname, 'testDomain'), (m) => {
      map = m;
      done();
    });
  });

  it('should create insert query', (done) => {
    done();
  });
});
