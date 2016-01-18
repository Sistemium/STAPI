'use strict';

const _ = require('lodash');
const dir = require('node-dir');

let map = new Map();

let normalizeConfig = (cfg, filename) => {
  if (!cfg || !_.isObject(cfg)) throw new Error(`Config not passed...`);

  let nCfg = _.cloneDeep(cfg);
  _.each(cfg.fields, (val, key) => {
    if (_.isString(val)) {
      nCfg.fields[key] = {
        field: val
      }
    } else if (_.isObject(val)) {
      nCfg.fields[key] = val;
    }
    else {
      throw new Error('Invalid configuration...');
    }
  });
  nCfg.collection = nCfg.collection ? nCfg.collection : filename;

  return nCfg;
};

let processConfig = (cfg, filename) => {
  let extendedCfg = normalizeConfig(cfg, filename);

  _.forEach(cfg.pools || [''], function (pool) {
    var extendsArray = Array.isArray(cfg.extends) ? cfg.extends : [cfg.extends];
    let pooledCfg = _.cloneDeep(extendedCfg);
    _.forEach(extendsArray, function (parent) {

      let parentCfg = {};
      if (parent) {
        parent = parent.toLowerCase();
        parentCfg = _.cloneDeep(map.get(pool + '/' + parent) || map.get('/' + parent));
        if (!parentCfg) {
          console.error({
            pool: pool,
            cfg: cfg,
            parent2: '/' + parent,
            map1: map.get(pool + '/' + parent),
            map2: map.get('/' + parent)
          });
          throw new Error('Unknown pool:' + pool);
        }
        delete parentCfg.abstract;
        delete parentCfg.pools;
      }
      pooledCfg = _.merge(parentCfg, extendedCfg);
      delete pooledCfg.pools;
    });
    map.set(pool + '/' + pooledCfg.collection.toLowerCase(), pooledCfg);
  });
};

module.exports = function (path, cb) {
  readConfigFiles(path, (files) => {
    _.each(files, (file) => {
      let cnfg = require(file);

      let filename = file.split('/').slice(-1)[0].split('.')[0];
      processConfig(cnfg, filename);
    });

    cb(map);
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
