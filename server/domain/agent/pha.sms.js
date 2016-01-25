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

  predicate: `(
    account.org in (select [data] from uac.tokenRole ('pha.org',@UACToken))
    OR exists (select * from uac.tokenRole ('pha.org',@UACToken) where [data] = '*')
  )`

};
