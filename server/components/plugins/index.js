'use strict';
let map = new Map();

const debug = require('debug')('stapi:plugins');

export default function () {

  function registerPlugin(code,plugin) {
    map.set(code, plugin);
    debug ('registerPlugin', code);
  }

  function getPlugin(code) {
    return map.get(code);
  }

  return {
    register: registerPlugin,
    get: getPlugin
  };
}
