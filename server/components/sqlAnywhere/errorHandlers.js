'use strict';

const debug = require('debug')('stapi:sa');

module.exports = function(conn) {

  function killer() {

    debug('killer', 'conn name:', conn.name);

    if (conn.connectedAt) {
      conn.disconnect(function () {
        process.exit();
      });
    } else {
      process.exit();
    }

  }

  process.on('disconnect', killer);
  process.on('SIGINT', killer);
  process.on('SIGTERM', killer);

};
