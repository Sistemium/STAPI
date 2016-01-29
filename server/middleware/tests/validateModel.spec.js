'use strict';

import httpMocks from 'node-mocks-http';
import validateModel from '../validateModel';
import domainConfig from '../../components/orm/domainConfigsParser';
import path from 'path';
import registerPlugins from '../../components/plugins/registerPlugins';

describe('validate model middleware', () => {
  let parsedConfigs;
  before((done) => {
    domainConfig(path.normalize(path.join(__dirname + '../../../' + 'domain')), (m) => {
      parsedConfigs = m;
      done();
    });
  });

  it('should validate model', () => {

    //arrange
    let req = httpMocks.createRequest({
      method: 'GET',
      url: 'api',
      body: [ { id: 'eaf49638-8fe3-46ce-9f51-061be072c3a3',
        code: 641,
        name: 'Мосин Денис',
        mobileNumber: '83706072545',
        org: 'dev',
        info: 'dm:37060725455',
        email: 'dm@sistemium.com',
        salesman: null,
        billingName: null,
        roles: '312:3123,dsada',
        isDisabled: 0,
        author: null } ]
    });
    req.auth = {};
    req.auth.roles = ['pha.org'];
    let res = httpMocks.createResponse();
    res.locals = {};
    res.locals.config = parsedConfigs.get('pha/account');

    //act
    validateModel()(req, res, (err) => {});

    expect(res.statusCode).equal(406);

  });


});
