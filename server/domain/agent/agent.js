var validators = require ('validators');

module.exports = {

  pools: ['pha'],
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
      converter: mobileNumber => {
        return mobileNumber ? '8' + mobileNumber.replace(/(8|^)([0-9]{10,11}).*$/, '$2') : null;
      },
      validators: [validators.required, validators.checkMobileNumber]
    },
    org: {
      validators: [function (req,val) {
        return validators.checkRole(req, 'pha.org', val);
      }]
    },
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
