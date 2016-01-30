'use strict';

import poolManager from 'components/pool/poolManager';
var async = require('async');

export default function () {
  return function (req, res, next) {
    let pool = poolManager.getPoolByName(req.pool);

    if (!pool) {
      return res.status(404).end();
    }

    async.eachSeries(pool.config.middleware,(mw,done) => {
      mw (req, res, done);
    }, next);

  }
}
