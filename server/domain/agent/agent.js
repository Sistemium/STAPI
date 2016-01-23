module.exports = {
  pools: ['phatest'],
  extends: 'defaultFields',
  fields: {
    code: {
      field: 'id'
    },
    name: 'name',
    mobileNumber: {
      expr: 'substring(mobile_number,2)',
      field: 'mobile_number'
    },
    org: 'org',
    info: 'info',
    email: 'email',
    roles: 'roles',
    isDisabled: {
      type: 'boolean'
    },
    lastAuth: {
      expr: '(select max([lastAuth]) from [pha].[accesstoken] where [agent] = [Agent].[id])'
    }
  },
  tableName: '[pha].[Agent]',
  alias: 'Agent',
  collection: 'agent'
};
