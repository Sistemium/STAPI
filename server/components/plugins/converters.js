'use strict';

export function mobileNumberConverter(mobileNumber) {
  return mobileNumber ? '8' + mobileNumber.replace(/(8|^)([0-9]{10,11}).*$/, '$2') : null;
}
