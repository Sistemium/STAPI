'use strict';

export default function (config, xid) {

  let obj = {
    query: '',
    params: []
  };

  if (typeof config.deletable === 'string') {
    obj.query += `UPDATE ${config.tableName} SET ${config.deletable} WHERE ${config.fields.id.field} = ? AND NOT ${config.deletable}`;
    obj.params.push(xid);
  } else if (config.deletable) {
    obj.query += `DELETE ${config.tableName} WHERE ${config.fields.id.field} = ?`;
    obj.params.push(xid);
  }

  return obj;

}
