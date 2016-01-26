"use strict";

let selectQuery = require('./selectQuery');
let insertQuery = require('./insertQuery');

export function select(config, params) {
  return selectQuery(config, params);
}

export function insert(config, body) {
  return insertQuery(config, body);
}
