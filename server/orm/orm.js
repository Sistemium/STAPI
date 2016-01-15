"use strict";

let _ = require('lodash');

let createQuery = require('./createQuery');
let insertQuery = require('./insertQuery');

export function query (config,params, map, pool) {
    return createQuery(config,params, map, pool);
}

export function insert (body, config, map, pool) {
    return insertQuery(body, config, map, pool);
}
