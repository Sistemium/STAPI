module.exports = {
    pools: ['bsd'],
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
        isDone: {
            field: 'isDone',
            type: 'boolean'
        }
    },
    tableName: '[bs].[InventoryBatch]',
    alias: 'InventoryBatch'
};
