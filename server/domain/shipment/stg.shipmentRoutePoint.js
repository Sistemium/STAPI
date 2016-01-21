'use strict';

module.exports = {

  pools: ['dev'],
  extends: 'defaultFields',
  fields: {
    isReached: {
      field: 'isReached',
      type: 'boolean'
    },
    ord: {
      type: 'int'
    },
    name: 'name',
    locationPoint: {
      field: 'locationPoint',
      parser: 'ar.fromARObject'
    },
    pictures: {
      field: 'pictures',
      parser: 'ar.fromARArray'
    },
    shipment: {
      field: 'shipment',
      parser: 'ar.fromARObject'
    }
  },
  tableName: '[stg].[ShipmentRoutePoint](default, 1172)',
  alias: 'sr'
};
