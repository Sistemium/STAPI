var connParams =require('./../config/sqlanywhere/connectionParams').connectionParams.phatest;

module.exports = {
    connectionParams: connParams || process.env.SQLANY,
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
        mobileNumber: {
            expr: 'substring(mobile_number,2)',
            field: 'mobile_number'
        },
        org: 'org',
        info: 'info',
        email: 'email',
        roles: 'roles',
        isDisabled: {
            expr: 'isnull(isDisabled,0)',
            field: 'isDisabled'
        },
        lastAuth: {
            expr: '(select max([lastAuth]) from [pha].[accesstoken] where [agent] = [Agent].[id])'
        }
    },
    tableName: '[pha].[Agent]',
    alias: 'Agent'
};
