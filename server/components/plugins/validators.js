'use strict';
const _ = require('lodash');

export default {
  checkRole:  (req, role, value) => {
    let auth = req.auth;
    let matchingRole = auth.roles && auth.roles[role];
    if (!matchingRole) {
      return `No authorization for "${role}"`
    } else {
      let data = Array.isArray (matchingRole) && matchingRole || [matchingRole];
      if (!_.find (data, v => {return v == value})) {
        return 'Valid values: ' + data.join();
      }
    }
  },
  checkMobileNumber: (value) => {
    if (!value.match(/^[0-9]{10,11}$/)) {
      return `Value ${value} is incorrect. Mobile number must be of 10 to 11 digits.`;
    }
  },
  required: (value) => {
    if (!value) {
      return `Field is required.`;
    }
  }
}
