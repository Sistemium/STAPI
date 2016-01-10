"use strict";

let createQuery = require('./createQuery');
let insertQuery = require('./insertQuery');

export function query (config,params) {
    return createQuery(config,params);
}

export function insert (body, config) {
    return insertQuery(body, config);
}
