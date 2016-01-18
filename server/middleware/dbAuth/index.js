'use strict';
import poolManager from '../../pool/poolManager';

export default function () {
    return function (req, res, next) {
        let pool = poolManager.getPoolByName(req.pool);

        if (pool.config.dbAuth) {
            pool.config.dbAuth (req, res, next);
        } else {
            next();
        }
    }
}
