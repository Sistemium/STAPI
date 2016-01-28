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
      converter: (org,req) => {
        return org || req.auth && req.auth.account.org;
      },
      validators: [(val,req) => {

        if (req.auth.roles ['pha.org']) {
          return validators.checkRole('pha.org', val, req);
        } else {
          return validators.hasNoRole('pha.admin', req) || validators.matchOrg (val, req);
        }

      }]
    },
    info: true,
    email: true,
    salesman: true,
    billingName: {
      field: 'billing_name',
      validators: (val,req) => {
        if (req.auth.account.org === 'un'){
          return validators.required (val);
        }
      }
    },
    roles: {
      validators: [function (val) {
        if (!val) {
          return;
        }
        var roles = val.split(',');
        if (roles.filter(role => {
            return !role.match(/^[a-z0-9\.\-]+(:[a-z0-9\.\-*]+$|$)/i);
          }).length) {
          return 'Roles must be role1:val1,role2:val2,role3';
        }
      },function (val) {
        if (val && val.match(/([,]|^)pha\.org([:,]|$)/ig)) {
          return 'Setting pha.org role is not allowed';
        }
      }]
    },
    isDisabled: {
      type: 'boolean'
    },
    lastAuth: {
      expr: '(select max([lastAuth]) from [pha].[accesstoken] where [agent] = [Agent].[id])'
    },
    author: {
      type: 'int'
    }
  },
  deletable: true,

  //predicate: function (req) {
  //  return predicates.fieldInRoleData('Agent.org','pha.org',req);
  //}


  predicate: {
    field: 'org',
    fn: function (req) {
      if (req.auth.roles ['pha.org']) {
        return predicates.inRoleData('pha.org', req);
      } else {
        return predicates.matchAccountOrg(req);
      }
    }
  }

};
