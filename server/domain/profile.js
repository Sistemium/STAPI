module.exports = {
    pools: ['phatest'],
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
            field: 'id'
        },
        name: {
            field: 'name',
            type: 'string'
        },
        minBuild: 'minBuild',
        maxBuild: 'maxBuild'
    },
    tableName: '[pha].[Profile]',
    alias: 'Profile'
};
