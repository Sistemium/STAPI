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

export function query (config,params) {
    return createQuery(config,params);
}

export function insert (body, config) {
    return insertQuery(body, config);
}
