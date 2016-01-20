'use strict';

import arXml from './parsers/arXml';
import plugins from './index';
const debug = require('debug')('stapi:plugins/registerPlugins');

export default function () {
  debug('registerPlugins', 'starting registering plugins');
  plugins().register('ar.fromARObject', arXml.fromARObject);
  plugins().register('ar.fromARArray', arXml.fromARArray);
  debug('registerPlugins', 'finished registering plugins');
}()
