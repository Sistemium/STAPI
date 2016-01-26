'use strict';

module.exports = {
  pools: ['dev'],
  fields: {
    id: 'xid',
    ts: {
      type: 'timestamp',
      readonly: true,
      field: 'ts'
    },
    cts: {
      type: 'timestamp',
      readonly: true,
      field: 'cts'
    },
    code: {
      field: 'code'
    },
    inventoryBatch: {
      field: 'inventoryBatch',
      ref: 'inventoryBatch'
    }
  },
  tableName: '[bs].[InventoryBatchItem]',
  alias: 'ibi',
  collection: 'inventoryBatchItem',
  deletable: true
};
