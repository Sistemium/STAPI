"use strict";

import selectQuery from './selectQuery';
import insertQuery from './insertQuery';
import deleteQuery from './deleteQuery';

export function select(config, params, predicates, selectFields) {
  return selectQuery(config, params, predicates, selectFields);
}

export function insert(config, body, predicates) {
  return insertQuery(config, body, predicates);
}

export function deleteQ(config, selectObj) {
  return deleteQuery(config, selectObj);
}
