'use strict';
var httpMocks = require('node-mocks-http');
import extractPool from '../extractPool';

describe('extract pool', function () {

  it('should extract pool', (done) => {
    //arrange
    let request = httpMocks.createRequest({
      method: 'GET',
      url: 'api',
      params: {
        pool: 'phaTest'
      }
    });

    let response = httpMocks.createResponse();

    extractPool()(request, response, () => {

      expect(request.pool).equal('phatest');
      done();
    });

  });

});
