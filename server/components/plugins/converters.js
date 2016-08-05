'use strict';

export function boolConverter(val) {
  return (val === '0' || val === 'false' || !val) ? 0 : 1
}

export function jsonConverter(val) {
  try {
    return val ? JSON.stringify(val) : null;
  } catch (err) {
    throw new Error(err);
  }
}
