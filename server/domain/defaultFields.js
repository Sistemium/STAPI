"use strict";

module.exports = {

  //pools: ['phatest','bsd'],

  abstract: true,
  fields: {
    id: 'xid',
    ts: {
      field:'ts',
      readonly: true
    },
    //cts: 'cts',
    author: 'author'
  }

};
