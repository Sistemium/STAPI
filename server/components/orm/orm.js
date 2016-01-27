"use strict";

import selectQuery from './selectQuery';
import insertQuery from './insertQuery';
import deleteQuery from './deleteQuery';

export function select(config, params, predicates) {
  return selectQuery(config, params, predicates);
}

export function insert(config, body) {
  return insertQuery(config, body);
}

export function deleteQ(config, xid) {
  return deleteQuery(config, xid);
}
