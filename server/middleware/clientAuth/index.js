'use strict';

import poolManager from '../../pool/poolManager';

export default function () {
    return function (req,res,next) {
        let pool = poolManager.getPoolByName(req.pool);
        console.log ('Auth: ', !!pool.config.clientAuth);

        if (pool.config.clientAuth) {
            pool.config.clientAuth (req,res,next);
        } else {
            next();
        }

    }
}
