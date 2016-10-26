'use strict';

import poolManager from 'components/pool/poolManager';
import async from 'async';

export default function (key) {

  key = key || 'middleware';

  return (req, res, next) => {

    let pool = poolManager.getPoolByName(req.pool);

    if (!pool) {
      return res.status(404).end();
    }

    async.eachSeries(pool.config[key], (mw, done) => mw(req, res, done), next);

  }

}
