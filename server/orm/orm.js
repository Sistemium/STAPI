let createQuery = require('./createQuery')
    , toModel = require('./transformResponseToModel');

export function query (config) {
    "use strict";
    return createQuery(config);
}
