'use strict';

import poolManager from '../pool/poolManager.js';

export default function () {
    return function (req,res,next) {
        let pool = poolManager.getPoolByName(req.pool);

        console.log ('Auth: ', !!pool.config.preAuth);

        if (pool.config.preAuth) {
            pool.config.preAuth (req,res,next);
        } else {
            next();
        }

    }
}
