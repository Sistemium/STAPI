'use strict';
const _ = require('lodash');

module.exports = function () {
    return function (req, res, next) {

        let path = req.originalUrl.split('?')[0];
        if (path.match(/favicon\.ico/i)) {
            return next();
        }

        if (!path.match(/\/api\//i)) {
            return next();
        }

        let arr = path.split('/');
        let collection;

        if (path.match(/api\/v[0-9]\/i/)) {
            req.pool = arr[3];
            collection = arr[4];
        } else if (path.match(/api\//i)) {
            req.pool = arr[2];
            collection = arr[3];
        }
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
