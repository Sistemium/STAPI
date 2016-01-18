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
        }
    },
    tableName: '[stg].[InventoryBatch]()',
    alias: 'ib',
    collection: 'inventoryBatch'

};
