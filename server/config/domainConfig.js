'use strict';

const _ = require('lodash');
const plugins = require('../components/plugins');
const dir = require('node-dir');

let map = new Map();

function parseFields(fields) {
  let parsed = {};
  if (!_.isObject(fields)) throw new Error('Model definition must be an object');
  _.each(Object.keys(fields), (n) => {
    if (_.isObject(fields[n])) {
      let propObj = fields[n];

      if (propObj.hasOwnProperty('ref')) {
        parsed[n] = {
          ref: propObj['ref'],
          property: n,
          field: propObj['field']
        };
      }
      else if (propObj['field'] && _.isString(propObj['field'])) {
        parsed[n] = propObj;
        if (propObj['parser']) {
          parsed[n].parser = plugins().get(propObj['parser']);
        }
      } else if (propObj['expr']) {
        parsed[n] = {expr: propObj['expr']};
        if (propObj['parser']) {
          parsed[n].parser = plugins().get(propObj['parser']);
        }
      }
      else {
        throw new Error('Invalid model definition');
      }
    } else {
      throw new Error('Invalid model definition');
    }
  });

  return parsed;
}

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
  nCfg.fields = parseFields(nCfg.fields);
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

export default function (path, cb) {
  readConfigFiles(path, (files) => {
    _.each(files, (file) => {
      let cnfg = require(file);

      let filename = file.split('/').slice(-1)[0].match(/([^\/]+)(?=\.\w+$)/)[0];
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
