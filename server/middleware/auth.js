'use strict';

import poolManager from '../pool/poolManager.js';

export default function () {
    return function (req,res,next) {
        let pool = poolManager.getPoolByName(req.pool);
        console.log ('Auth: ', !!pool.config.auth);

        if (pool.config.auth) {
            pool.config.auth (req,res,next);
        } else {
            next();
        }

    }
}
