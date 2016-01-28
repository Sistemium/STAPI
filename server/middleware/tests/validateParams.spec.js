'use strict';

const httpMocks = require('node-mocks-http');
import validateParams from '../validateParams';

describe('validate params middleware', () => {

  it('should validate params', () => {
    let request = httpMocks.createRequest({
      method: 'GET',
      url: 'api'
    });
    request['x-params'] = {
      'some[invalid9key': 'test'
    };

    let response = httpMocks.createResponse();

    validateParams()(request, response, (err) => {});
    expect(response.statusCode).equal(400);
  });

});
