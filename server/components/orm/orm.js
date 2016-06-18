"use strict";

import selectQuery from './selectQuery';
import insertQuery from './insertQuery';
import deleteQuery from './deleteQuery';
import dbDataParser from './dbDataParser';

export function select(config, params, predicates, selectFields) {
  return selectQuery(config, params, predicates, selectFields);
}

export function insert(config, body, predicates, poolConfig, joins) {
  return insertQuery(config, body, predicates, poolConfig, joins);
}

export function deleteQ(config, selectObj) {
  return deleteQuery(config, selectObj);
}

export function parseDbData(config, dbObj, req) {
  return dbDataParser(config, dbObj, req);
}
