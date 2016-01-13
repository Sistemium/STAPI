'use strict';
const _ = require('lodash');

module.exports = function () {
    return function (req, res, next) {

        req.pool = req.params.pool.toLowerCase();
        let collection = req.params.collection.toLowerCase();

        try {
            if (req.pool === undefined) {
                throw new Error('You did not pass pool name... Try /api/databaseName/collectionName')
            }

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
            if (!_.includes(appLocals.domain.pools, req.pool)) {
                throw new Error('Incorrect path or collection not exist... Try /api/databaseName/collectionName');
            }
        } catch (err) {
            console.log(`Path: /api/${req.pool}/${collection}`);
            return next(err);
        }
        next();
    }
};
