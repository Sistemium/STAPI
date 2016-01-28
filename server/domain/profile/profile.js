'use strict';

module.exports = (function () {
  return {
    pools: ['pha'],
    fields: {
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
    alias: 'p',
    collection: 'profile'
  }
})();
