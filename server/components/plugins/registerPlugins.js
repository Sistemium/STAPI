'use strict';

import arXml from './parsers/arXml';
import plugins from './index';
const debug = require('debug')('stapi:plugins/registerPlugins');

var parseBool = function(val) {return !!val;};

export default (function () {
  debug('registerPlugins', 'starting registering plugins');
  plugins().register('ar.fromARObject', arXml.fromARObject);
  plugins().register('ar.fromARArray', arXml.fromARArray);
  plugins().register('parse.int',parseInt);
  plugins().register('parse.float',parseFloat);
  plugins().register('parse.boolean',parseBool);
  plugins().register('parse.bool',parseBool);
  debug('registerPlugins', 'finished registering plugins');
})()
