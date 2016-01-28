'use strict';

const httpMocks = require('node-mocks-http');
import headersToParams from '../headersToParams';

describe('set headers to params middleware', () => {

  it('should set x-params', (done) => {
    let request = httpMocks.createRequest({
      method: 'GET',
      url: 'api',
      headers: {
        'x-page-size': 45,
        'x-start-page': 3
      }
    });

    let response = httpMocks.createResponse();

    headersToParams()(request, response, () => {
      expect(request['x-params']).to.be.an('object');
      expect(request['x-params']).to.have.keys(['x-page-size:', 'x-start-page:']);
      done();
    })
  });

});
