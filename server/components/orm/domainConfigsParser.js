'use strict';

const _ = require('lodash');
import plugins from '../plugins/index';
const dir = require('node-dir');
const debug = require('debug')('stapi:domainConfig');
import {getPoolsKeys,getPoolByName} from '../pool';

let map = new Map();

function parseFields(fields) {

  let parsed = {};

  if (!_.isObject(fields)) throw new Error('Model definition must be an object');

  _.each(fields, (field, key) => {
    if (_.isObject(field)) {

      if (field.expr && !field.converter) {
        field.readonly = true;
      }

      if (field.parser) {
        if (!(typeof field.parser === 'function')) {
          field.parser = plugins().get(field.parser);
        }
      } else {
        let typeParser = plugins().get('parse.' + field.type);
        if (typeParser) {
          field.parser = typeParser;
        }
      }

      if (field.converter) {
        if (!(typeof field.converter === 'function')) {
          field.converter = plugins().get(field.converter);
        }
      } else {
        let typeConverter = plugins().get('convert.' + field.type);
        if (typeConverter) {
          field.converter = typeConverter;
        }
      }

      if (field.validator) {
        if (!(typeof field.validator === 'function')) {
          field.validator = plugins().get(field.validator);
        }
      } else {
        let typeValidator = plugins().get('validator.' + field.type);
        if (typeValidator) {
          field.validator = typeValidator;
        }
      }

      if (field.fields) {
        field.fields = parseFields(field.fields);
        //debug (key, field.fields);
      }

      parsed[key] = field;

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

    if (!val) {
      delete nCfg.fields[key];
      return;
    } else if (val === true) {
      nCfg.fields[key] = {
        field: key
      }
    } else if (_.isString(val)) {
      nCfg.fields[key] = {
        field: val
      }
    } else if (_.isObject(val)) {
      nCfg.fields[key] = val;
    } else {
      throw new Error('Invalid configuration...');
    }

    if (!nCfg.fields[key].field) {
      nCfg.fields[key].field = key;
    }

    _.each(nCfg.fields[key].fields, (subField, subKey)=> {
      nCfg.fields[key].fields[subKey] = _.assign({
        field: subKey
      }, _.isString(subField) ? {field: subField} : subField);
    })

  });

  _.assign(nCfg, {
    fields: parseFields(nCfg.fields),
    collection: nCfg.collection || filename,
    selectFrom: nCfg.selectFrom || nCfg.tableName,
    alias: nCfg.alias || 't'
  });

  return nCfg;
};

let processConfig = (cfg, filename) => {

  let extendedCfg = normalizeConfig(cfg, filename);
  let pools = cfg.pools && _.filter(getPoolsKeys(), key => {
      let aliases = getPoolByName(key).config.aliasesRe;
      return key.match('^(' + cfg.pools.join('|') + ')$') || aliases && _.find(cfg.pools, function (key) {
          return key.match(aliases)
        });
    });

  _.forEach(pools || [''], function (pool) {
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
    pooledCfg.pool = pool;
    let mapKey = pool + '/' + pooledCfg.collection.toLowerCase();
    map.set(mapKey, pooledCfg);
  });
};

function addRefsToConfigs(map) {

  map.forEach((config) => {

    let pool = config.pool;

    if (!config.abstract) {
      _.each(config.fields, (val, key) => {
        if (val.ref) {
          let refConfig = map.get(`${pool}/${val['ref'].toLowerCase()}`);
          _.assign(config.fields[key], {
            //alias: refConfig.alias,
            tableName: refConfig.tableName,
            //TODO: ref id hardcoded for now, change it that id will have some special property
            id: refConfig.fields.id.field,
            refConfig: refConfig
          });

          if (!val.alias) {
            val.alias = key;
            if (config.refAliasRe) {
              let matched = key.match (config.refAliasRe);
              if (matched) {
                val.alias = _.tail (matched);
              }
            }
          }


          map.set(`${pool}/${config.collection.toLowerCase()}`, config);
        }
      });
    }
  });
}

export default function (path, cb) {
  readConfigFiles(path, (files) => {
    _.each(files, (file) => {
      let cnfg = require(file);
      let filename = file.split('/').slice(-1)[0].match(/([^\/]+)(?=\.\w+$)/)[0];
      processConfig(cnfg, filename);
    });

    addRefsToConfigs(map);
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
