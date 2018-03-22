'use strict';

import async from 'async';
import {getPoolByName} from '../../components/pool';

export default function (key) {

  key = key || 'middleware';

  return (req, res, next) => {

    let pool = getPoolByName(req.pool);

    if (!pool) {
      return res.status(404).end();
    }

    async.eachSeries(pool.config[key], (mw, done) => mw(req, res, done), next);

  }

}
