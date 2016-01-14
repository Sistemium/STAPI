'use strict';

const _ = require('lodash');
const dir = require('node-dir');

let map = new Map();

let normalizeConfig = (cfg) => {
    if (!cfg || !_.isObject(cfg)) throw new Error(`Config not passed...`);

    let normalizedCfg = {};
    _.each(cfg.fields, (val, key) => {
        if (_.isString(val)) {
            normalizedCfg[key] = {
                field: val
            }
        } else if (_.isObject(val)) {
            normalizedCfg[key] = val
        } else {
            throw new Error('Invalid configuration...');
        }
    });

    return normalizedCfg;
};

let processConfig = (cfg, filename) => {

    var extendedCfg = normalizeConfig(cfg);

    _.forEach(cfg.pools || [''], function (pool) {
        var extendsArray = Array.isArray(cfg.extends) ? cfg.extends : [cfg.extends];

        _.forEach(extendsArray, function (parent) {
            var parentCfg = map.get(pool + '/' + parent) || map.get('/' + parent) || {};
            extendedCfg = _.merge(parentCfg, extendedCfg);
        });

        let collectionName = cfg.collection ? cfg.collection : filename;
        map.set(pool + '/' + collectionName, cfg);
    });
};

module.exports = function (path) {
    readConfigFiles(path, (files) => {
        console.log(files);
        _.each(files, (file) => {
            console.log(file);
            let cnfg = require(file);

            let filename = file.split('/').slice(-1)[0].split('.')[0];
            processConfig(cnfg, filename);
        });

        console.log(map);
        return map;
    });
};

let readConfigFiles = (path, cb) => {
    dir.files(path, (err, files) => {
        if (err) throw err;
        files.sort((a, b) => {
            let aSlashNumber = a.match(/\//ig);
            let bSlashNumber = b.match(/\//ig);
            if (aSlashNumber > bSlashNumber) return 1;
            else if (aSlashNumber < bSlashNumber) return -1;
            else {
                return a.localeCompare(b);
            }
        });

        cb(files);
    });
};
