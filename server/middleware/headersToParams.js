'use strict';
const _ = require('lodash');

export default function () {
    return function (req, res, next) {
        let supportedHeaders = /x-page-size|x-start-page|x-order-by/i;

        function headersToParams (headers) {

            var params = {};

            _.forEach (headers,function(val, key){
                if (key.match(supportedHeaders)) {
                    params [key+':'] = val;
                }
            });

            return params;
        }

        req['x-params'] = _.assign(headersToParams(req.headers), {id: req.params.id}, req.query);
        next();
    }
}
