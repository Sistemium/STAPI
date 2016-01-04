var connParams =require('./../config/sqlanywhere/connectionParams').connectionParams;

module.exports = {
    connectionParams: connParams || process.env.SQLANY,
    fields: {
        id: 'xid',
        ts: {
            type: 'timestamp',
            field: 'ts'
        },
        cts: {
            type: 'timestamp',
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
            expr: 'substring(mobile_number,2)'
        },
        org: 'org',
        info: 'info',
        email: 'email',
        roles: 'roles',
        isDisabled: {
            expr: 'isnull(isDisabled,0)'
        },
        lastAuth: {
            expr: '(select max([lastAuth]) from [pha].[accesstoken] where [agent] = [Agent].[id])'
        }
    },
    tableName: '[pha].[Agent]'
};
