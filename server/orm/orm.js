"use strict";

let _ = require('lodash');

let selectQuery = require('./selectQuery');
let insertQuery = require('./insertQuery');

export function select (config, params, map, pool) {
    return selectQuery (config, params, map, pool);
}

export function insert (body, config, map, pool) {
    return insertQuery (body, config, map, pool);
}
