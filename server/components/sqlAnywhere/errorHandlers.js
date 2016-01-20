'use strict';

module.exports = function (conn) {
  var killer = function () {
    console.log('Killer sqlanywhere');
    if (conn.connectedAt) {
      conn.disconnect(function () {
        process.exit();
      });
    } else {
      process.exit();
    }
  };

  process.on('disconnect', killer);
  process.on('SIGINT', killer);
  process.on('SIGTERM', killer);
};
