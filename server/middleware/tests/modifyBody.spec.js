'use strict';

import httpMocks from 'node-mocks-http';
import modifyBody from '../modifyBody';
import domainConfig from '../../components/orm/domainConfigsParser';
import path from 'path';
import {assert}  from 'chai';
import registerPlugins from '../../components/plugins/registerPlugins';
import config from '../../config/environment';

describe('modify body middleware', () => {

  let parsedConfig;
  before((done) => {
    domainConfig(path.normalize(path.join(config.root, process.env.ST_COLLECTIONS)), (m) => {
      parsedConfig = m;
      done();
    });
  });

  it('should modify body', () => {

    let req = httpMocks.createRequest({
      method: 'POST',
      url: 'api',
      body:  {
        "author": null,
        "billingName": null,
        "code": 641,
        "email": "dm@sistemium.com",
        "id": "eaf49638-8fe3-46ce-9f51-061be072c3a3",
        "info": "dm:37060725455",
        "isDisabled": false,
        "lastAuth": null,
        "mobileNumber": "3706072545",
        "name": "Мосин Денис",
        "org": "dev",
        "roles": "312:3123,dsada",
        "salesman": null,
        "ts": "2016-01-26 20:12:54.935"
      }
    });

    let res = httpMocks.createResponse();
    res.locals = {};
    res.locals.config = parsedConfig.get('pha/account');

    modifyBody()(req,res, (err) => {
      assert.typeOf(req.body, 'array', 'req.body must be an array');
    });
  });

});
