'use strict';

import poolManager from '../../pool/poolManager';

export default function () {
    return function (req, res, next) {
        let pool = poolManager.getPoolByName(req.pool);

        if (pool.config.middleware && pool.config.middleware.length > 0) {

            let arr = pool.config.middleware;
            let ne = next;
            if (arr.length > 1) {
                ne = function () {
                    arr[1](req, res, next);
                };
                arr[0](req, res, ne);
            } else {
                arr[0](req, res, next);
            }
        } else {
            next();
        }
    }
}
