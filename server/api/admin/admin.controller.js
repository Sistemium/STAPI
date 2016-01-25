'use strict';
import domainConfig from '../../config/domainConfig';

function mapToJson(map) {
  return JSON.parse(JSON.stringify([...map]));
}

export function index(req, res) {
  return res.json(mapToJson(req.app.locals.domainConfig));
}

export function reload(req, res) {
  domainConfig('../../domain', map => {
    req.app.locals.domainConfig = map;
    return res.json(mapToJson(map));
  });
}
