'use strict';
let map = new Map();

export default function () {

  function registerPlugin(code,plugin) {
    map.set(code, plugin);
  }

  function getPlugin(code) {
    return map.get(code);
  }

  return {
    register: registerPlugin,
    get: getPlugin
  };
}
