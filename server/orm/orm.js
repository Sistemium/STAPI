"use strict";

let _ = require('lodash');

let createQuery = require('./createQuery');
let insertQuery = require('./insertQuery');

let supportedHeaders = /x-page-size|x-start-page/i;

export function headersToParams (headers) {

    var params = {};

    _.forEach (headers,function(val, key){
        if (key.match(supportedHeaders)) {
            params [key+':'] = val;
        }
    });

    return params;
}

export function query (config,params, map, pool) {
    return createQuery(config,params, map, pool);
}

export function insert (body, config, map, pool) {
    return insertQuery(body, config, map, pool);
}
