'use strict';

module.exports = {

  pools: ['dev'],
  extends: 'defaultFields',
  fields: {
    code: {
      field: 'code'
    },
    isDone: {
      field: 'isDone',
      type: 'boolean'
    },
    items: {
      expr: `(select xmlelement('Object',
                xmlelement('i',xmlattributes('cnt' as name), count (*)),
                xmlelement('decimal',xmlattributes('avgSeconds' as name), cast (
                    if count (*) > 1 then datediff (
                        second,
                        min(isnull(ibi.deviceCts,ibi.ts)),
                        max(isnull(ibi.deviceCts,ibi.ts))
                    ) * 1.0 / (count (*) - 1) endif
                as decimal(10,1)))
            )
            from bs.InventoryBatchItem ibi
            where ibi.inventoryBatch = ib.id
        )`
    }
  },
  tableName: '[stg].[InventoryBatch]',
  alias: 'ib',
  collection: 'inventoryBatch',
  join: 'JOIN uac.account a on a.id = ib.author',
  predicate: `(ib.site in (
        select [data] from uac.tokenRole ('site',@UACToken)
    ) or exists (
        select * from uac.tokenRole ('warehouse',@UACToken)
    )) and ib.isRemoved = 0 and exists (
        select * from bs.InventoryBatchItem ibi
        where ibi.inventoryBatch = ib.id
    )`
};
