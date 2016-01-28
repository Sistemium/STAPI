'use strict';

var httpMocks = require('node-mocks-http');
import extractFromUrl from '../extractFromUrl';

describe('extract from url middleware', function () {

  it('should extract config into res.locals', (done) => {
    let request = httpMocks.createRequest({
      method: 'GET',
      url: 'api',
      params: {
        collection: 'someCollection'
      }
    });
    request.pool = 'test';
    request.app = {};
    request.app.locals = {
      domainConfig: new Map([
        ['test/somecollection', 'test']
      ])
    };

    let response = httpMocks.createResponse();

    response.locals = {};

    extractFromUrl()(request, response, () => {
      expect(response.locals.config).equal('test');
      done();
    });

  });
});
