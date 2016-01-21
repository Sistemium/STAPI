'use strict';

module.exports = {

  pools: ['dev'],
  extends: 'defaultFields',
  fields: {
    isReached: {
      type: 'boolean'
    },
    ord: {
      type: 'int'
    },
    name: 'name',
    locationPoint: {
      parser: 'ar.fromARObject'
    },
    pictures: {
      parser: 'ar.fromARArray'
    },
    shipment: {
      parser: 'ar.fromARObject'
    }
  },
  tableName: '[bs].[ShipmentRoutePoint]',
  selectFrom: '[stg].[ShipmentRoutePoint](${@shipmentRoute})',
  alias: 'sr'
};
