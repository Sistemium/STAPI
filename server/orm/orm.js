"use strict";

let createQuery = require('./createQuery');
let insertQuery = require('./insertQuery');

export function query (config) {
    return createQuery(config);
}

export function insert (body, config) {
    return insertQuery(body, config);
}
