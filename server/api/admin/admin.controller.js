'use strict';
import domainConfig from '../../config/domainConfig';
import path from 'path';

export function index(req, res) {
  let collection = req.params.collection || req.query.collection;
  if (collection) {
    let config = req.app.locals.domainConfig.get(collection);
    if (config) {
      return res.json(config);
    } else {
      return res.status(404).end('Config not found...');
    }
  }

  if (req.query && req.query.reload) {
    domainConfig(path.join(__dirname, '../..', 'domain'), map => {
      req.app.locals.domainConfig = map;
      return res.json([...map]);
    });
  } else {
    return res.json([...req.app.locals.domainConfig]);
  }
}
