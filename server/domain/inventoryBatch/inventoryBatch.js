'use strict';

module.exports = {

  pools: ['dev'],
  extends: 'defaultFields',
  fields: {
    deviceCts: 'deviceCts',
    code: {
      field: 'code'
    },
    isDone: {
      type: 'boolean'
    },
    author: {
      ref: 'uac.account',
      insertRaw: true,
      fields: {
        name: 'name'
      }
    },
    items: {
      readonly: true,
      fields: {
        cnt: 'cnt',
        avgSeconds: {
          type: 'float'
        }
      }
    }
  },
  tableName: '[bs].[InventoryBatch]',
  alias: 'ib',
  collection: 'inventoryBatch',
  join: `outer apply (select
      count (*) as cnt,
      cast (
          if count (*) > 1 then datediff (
              second,
              min(isnull(ibi.deviceCts,ibi.ts)),
              max(isnull(ibi.deviceCts,ibi.ts))
          ) * 1.0 / (count (*) - 1) endif
      as decimal(10,1)) as avgSeconds
    from bs.InventoryBatchItem ibi
    where ibi.inventoryBatch = ib.id
  ) as items`,
  predicate: `(ib.site in (
        select [data] from uac.tokenRole ('site',@UACToken)
    ) or exists (
        select * from uac.tokenRole ('warehouse',@UACToken)
    )) and ib.isRemoved = 0 and exists (
        select * from bs.InventoryBatchItem ibi
        where ibi.inventoryBatch = ib.id
    )`
};
