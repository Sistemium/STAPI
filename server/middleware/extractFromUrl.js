'use strict';
const _ = require('lodash');

module.exports = function () {
    return function (req, res, next) {

        // req.originalUrl = 'api/v1/dbname/collection
        let path = req.originalUrl.split('?')[0];
        console.log(path);
        if (path.match(/favicon\.ico/i)) {
            return next();
        }

        if (!path.match(/\/api\//i)) {
            return next();
        }

        let arr = path.split('/');

        if (path.match(/api\/v[0-9]\/i/)) {
            req.dbname = arr[3];
            req.collection = arr[4];
        } else if (path.match(/api\//i)) {
            req.dbname = arr[2];
            req.collection = arr[3];
        }
        try {
            if (req.collection === undefined) {
                throw new Error('You did not pass collection name... Try /api/databaseName/collectionName');
            }

            let collection = require(`../domain/${req.collection.toLowerCase()}`);
            if (!_.includes(collection.pools, req.dbname.toLowerCase())) {
                throw new Error('Incorrect path or collection not exist... Try /api/databaseName/collectionName');
            }
        } catch (err) {
            console.log(`Path: ${path}`);
            return next(err);
        }
        next();
    }
};
