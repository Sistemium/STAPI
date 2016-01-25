'use strict';
import makeMap from '../../config/domainConfig';
import path from 'path';

export function index(req, res) {
  console.log(req.params);
  let domainConfig = req.app.locals.domainConfig;
  let pool = req.params.pool || req.query.pool;
  let entity = req.params.entity || req.query.entity;
  let configName = pool && entity ? `${pool}/${entity}` : req.query.config;
  if (configName) {
    if (pool && pool.match(/abstract/i)) {
      let config = domainConfig.get('/'+entity);
      if (!!config) {
        return res.json(config);
      } else {
        return res.status(404).end('Config not found...');
      }
    }
    let config = domainConfig.get(configName);
    if (!!config) {
      return res.json(config);
    } else {
      return res.status(404).end('Config not found...');
    }
  } else if (pool) {
    let result = {};
    let poolRegex = new RegExp(pool, 'i');
    let keyPool = '';
    domainConfig.forEach((value, key) => {
      keyPool = key.split('/')[0];
      if (keyPool.match(poolRegex)) {
        result[key] = value;
      }
    });
    if (!!result) {
      return res.json(result);
    } else {
      return res.status(404).end('Config not found...');
    }
  } else if (!pool && entity) {
    let config = domainConfig.get('/'+entity);
    if (!!config) {
      return res.json(config);
    } else {
      return res.status(404).end('Config not found...');
    }
  }

  if (req.query.reload) {
    makeMap(path.join(__dirname, '../..', 'domain'), map => {
      domainConfig = map;
      return res.json([...map]);
    });
  } else {
    return res.json([...domainConfig]);
  }
}
