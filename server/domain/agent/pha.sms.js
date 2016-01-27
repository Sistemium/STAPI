var predicates = require('predicates');

module.exports = {

  pools: ['pha'],
  extends: 'defaultFields',
  tableName: '[pha].[Sms]',
  collection: 'sms',

  fields: {
    mobileNumber: true,
    text: true,
    account: {
      ref: 'account'
    }
  },

  //predicate: (req) => {return predicates.fieldInRoleData ('account.org','pha.org',req);}

};
