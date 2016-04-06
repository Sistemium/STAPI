'use strict';

import _ from 'lodash';
import plugins from './index';
const debug = require('debug')('stapi:plugins:registerPlugins');
import path from 'path';
import config from '../../config/environment';
import {boolConverter, jsonConverter} from './converters';

let externalPluginsPaths = process.env.PLUGINS;

if (externalPluginsPaths) {
  let paths = externalPluginsPaths.split(':');
  _.each(paths, (p) => {

    let pth = path.normalize(path.join(config.root, p));
    require(pth);
    debug('registerPlugins', pth);

  });
} else {
  debug('registerPlugins', 'Path for plugins is not specified');
}

var parseBool = function(val) {return !!val;};
var parseJson = function(val) {
  try {
    return JSON.parse(val);
  } catch (err) {
    debug('error', 'Error occurred during parsing of json');
    throw new Error(err);
  }
};

export default (function () {
  debug('registerPlugins', 'starting registering plugins');
  plugins().register('parse.int',parseInt);
  plugins().register('parse.float',parseFloat);
  plugins().register('parse.decimal',parseFloat);
  plugins().register('parse.boolean',parseBool);
  plugins().register('parse.bool',parseBool);
  plugins().register('parse.json', parseJson);
  plugins().register('convert.bool', boolConverter);
  plugins().register('convert.boolean', boolConverter);
  plugins().register('convert.json', jsonConverter);
  debug('registerPlugins', 'finished registering plugins');
})()
