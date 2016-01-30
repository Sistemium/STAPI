'use strict';

import _ from 'lodash';
import plugins from './index';
const debug = require('debug')('stapi:plugins:registerPlugins');
import path from 'path';
import config from '../../config/environment';

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

export default (function () {
  debug('registerPlugins', 'starting registering plugins');
  plugins().register('parse.int',parseInt);
  plugins().register('parse.float',parseFloat);
  plugins().register('parse.boolean',parseBool);
  plugins().register('parse.bool',parseBool);
  debug('registerPlugins', 'finished registering plugins');
})()
