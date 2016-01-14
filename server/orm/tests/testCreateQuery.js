'use strict';

const createQuery = require('../createQuery');
const config = require('../../domain/agent/oneMoreLevel/agent');
const assert = require('assert');

describe('Create query', function () {
    it('should create query', function () {
        let res = createQuery(config);
        expect(res).toBeA(string);
    })
});
