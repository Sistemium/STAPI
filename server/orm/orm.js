"use strict";

let createQuery = require('./createQuery');

export function query (config) {
    return createQuery(config);
}
