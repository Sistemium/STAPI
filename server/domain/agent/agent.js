module.exports = {

  pools: ['phatest'],
  extends: 'defaultFields',
  tableName: '[pha].[Agent]',
  alias: 'Agent',
  collection: 'account',

  fields: {
    code: 'id',
    name: true,
    mobileNumber: {
      expr: 'substring(mobile_number,2)',
      field: 'mobile_number',
      converter: 'ar.mobileNumberConverter'
    },
    org: true,
    info: true,
    email: true,
    roles: true,
    isDisabled: {
      type: 'boolean'
    },
    lastAuth: {
      expr: '(select max([lastAuth]) from [pha].[accesstoken] where [agent] = [Agent].[id])'
    }
  },

  predicate: `(
    Agent.org in (select [data] from uac.tokenRole ('pha.org',@UACToken))
    OR exists (select * from uac.tokenRole ('pha.org',@UACToken) where [data] = '*')
  )`

};
