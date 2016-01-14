'use strict';

module.exports = {

    pools: ['bsd'],
    extends: 'bsd/defaultFields',
    fields: {
        code: {
            field: 'code'
        },
        isDone: {
            field: 'isDone',
            type: 'boolean'
        }
    },
    tableName: '[bs].[InventoryBatch]',
    alias: 'ib',
    collection: 'inventoryBatch'

};
