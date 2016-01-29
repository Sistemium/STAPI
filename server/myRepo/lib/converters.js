'use strict';

export function boolConverter(val) {
  return (val === '0' || !val) ? 0 : 1
}
