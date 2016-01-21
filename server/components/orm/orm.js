"use strict";

let _ = require('lodash');

let selectQuery = require('./selectQuery');
let insertQuery = require('./insertQuery');

export function select(config, params) {
  return selectQuery(config, params);
}

export function insert(body, config, map, pool) {
  return insertQuery(body, config, map, pool);
}
