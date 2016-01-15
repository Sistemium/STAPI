'use strict';

module.exports = {

    pools: ['bsd'],
    extends: 'defaultFields',
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
