'use strict';
const _ = require('lodash');

export default function () {
    return function (req, res, next) {

        _.each(req['x-params'], (param, key) => {
            if (param) {
                if (param.match(/[\[\]-_\s]/i)) {
                    console.log(`Invalid key in params: ${key}`);
                    next(new Error(`Param value cannot contain such symbols: "[", "]", "-", "_", "space"`));
                }
            }
        });
        next();
    }
}
