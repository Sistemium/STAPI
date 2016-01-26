'use strict';
const _ = require('lodash');

export default {
  checkRole:  (req, role, value) => {
    let auth = req.auth;
    let matchingRole = auth.roles && auth.roles[role];
    if (!matchingRole) {
      return `Need "${role}" to allow updates`
    } else {
      let data = Array.isArray (matchingRole) && matchingRole || [matchingRole];
      if (!_.find (data, v => {return v == '*' || v == value})) {
        return 'Valid values: ' + data.join();
      }
    }
  },
  checkMobileNumber: (req, value) => {
    if (!value || !value.match(/^[0-9]{10,11}$/)) {
      return `Mobile number must be of 10 to 11 digits.`;
    }
  },
  required: (req, value) => {
    if (!value) {
      return `Field is required.`;
    }
  }
}
