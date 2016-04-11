'use strict';

export default function (config, selectObj) {

  let obj = {
    query: '',
    params: []
  };

  if (typeof config.deletable === 'string') {
    obj.query += `UPDATE ${config.tableName} SET ${config.deletable} WHERE ${config.fields.id.field} = (${selectObj.query}) AND NOT ${config.deletable}`;
    obj.params = obj.params.concat(selectObj.params);
  } else if (config.deletable) {
    obj.query += `DELETE ${config.tableName} WHERE ${config.fields.id.field} = (${selectObj.query})`;
    obj.params = obj.params.concat(selectObj.params);
  }

  return obj;

}
