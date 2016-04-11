'use strict';

export function boolConverter(val) {
  return (val === '0' || !val) ? 0 : 1
}

export function jsonConverter(val) {
  try {
    return JSON.stringify(val);
  } catch (err) {
    throw new Error(err);
  }
}
