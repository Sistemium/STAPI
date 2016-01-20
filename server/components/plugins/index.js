'use strict';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
const debug = require('debug')('stapi:plugins');

export default function () {
  let normalizedPath = path.join(__dirname, 'parsers');
  let map = new Map();
  let mapFileNames = new Map();
  let i = 0;
  fs.readdirSync(normalizedPath).forEach((file) => {
    ++i;
    mapFileNames.set(file, i);
    let required = require(`${normalizedPath}/${file}`);
    debug('plugins/index.js', `path is: ${normalizedPath}`);
    map.set(i, required);
  });

  function registerPlugin(plugin) {
    ++i;
    debug('plugins/index.js', `trying to register ${plugin}`);
    map.set(i, plugin);
  }

  function getPlugin(code) {
    debug('plugins/index.js', `trying to get plugin with code ${code}`);
    if (_.isString(code)) {
      let c = mapFileNames.get(code);
      return map.get(c);
    }
    let plugin = map.get(code);
    debug('plugins/index.js', `plugin with code: ${code} is ${plugin}`);
    return plugin;
  }

  return {
    register: registerPlugin,
    get: getPlugin
  }
}
