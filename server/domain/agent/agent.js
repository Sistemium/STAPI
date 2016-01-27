var validators = require('validators');
var predicates = require('predicates');

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
      validators: [function (val, req) {
        return validators.checkRole('pha.org', val, req);
      }]
    },
    info: true,
    email: true,
    roles: {
      validator: function (val) {
        if (!val) {
          return;
        }
        var roles = val.split(',');
        if (roles.filter(role => {
            return !role.match(/[a-z1-9]+(:[a-z1-9]+|$)/i);
          }).length) {
          return 'Roles must be role1:val1,role2:val2,role3';
        }
      }
    },
    isDisabled: {
      type: 'boolean'
    },
    lastAuth: {
      expr: '(select max([lastAuth]) from [pha].[accesstoken] where [agent] = [Agent].[id])'
    }
  },
  deletable: true,

  predicate: function (req) {
    return predicates.fieldInRoleData('Agent.org','pha.org',req);
  }


  //predicate: {
  //  field: 'org',
  //  fn: function (req) {
  //    return predicates.inRoleData('pha.org',req);
  //  }
  //}

};
