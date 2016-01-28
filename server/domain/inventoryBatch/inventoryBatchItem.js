'use strict';

module.exports = {
  pools: ['dev'],
  fields: {
    id: 'xid',
    ts: {
      type: 'timestamp',
      readonly: true
    },
    cts: {
      type: 'timestamp',
      readonly: true
    },
    code: true,
    inventoryBatch: {
      ref: 'inventoryBatch'
    }
  },
  tableName: '[bs].[InventoryBatchItem]',
  alias: 'ibi',
  collection: 'inventoryBatchItem',
  deletable: true
};
