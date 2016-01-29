'use strict';
import plugins from '../../components/plugins/index';
const debug = require('debug')('stapi:myRepo:lib');
import {fromARObject, fromARArray} from './parsers/arXml';
import {boolConverter} from './converters';

export default (function () {
  debug('myRepo.lib', 'starting registering plugins');
  plugins().register('ar.fromARObject', fromARObject);
  plugins().register('ar.fromARArray', fromARArray);
  plugins().register('convert.bool', boolConverter);
  plugins().register('convert.boolean', boolConverter);
  debug('myRepo.lib', 'finishing registering plugins');
})();
