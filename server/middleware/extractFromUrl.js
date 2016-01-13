'use strict';
const _ = require('lodash');

module.exports = function () {
    return function (req, res, next) {

        req.pool = req.params.pool;
        let collection = req.params.collection;

        try {
            if (collection === undefined) {
                throw new Error('You did not pass collection name... Try /api/databaseName/collectionName');
            }

            let keyInMap = `${req.pool}/${collection}`;
            let appLocals = req.app.locals;
            let domainConfig = appLocals.domainConfig.get(keyInMap);
            if (!(appLocals && domainConfig)) {
                throw new Error(`${keyInMap} not exist`);
            }

            appLocals.domain = domainConfig;
            if (!_.includes(appLocals.domain.pools, req.pool.toLowerCase())) {
                throw new Error('Incorrect path or collection not exist... Try /api/databaseName/collectionName');
            }
        } catch (err) {
            console.log(`Path: ${path}`);
            return next(err);
        }
        next();
    }
};
