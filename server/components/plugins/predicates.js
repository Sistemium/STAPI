var _ = require('lodash');

let functions = {

  fieldInRoleData: function (field, role, req) {

    let res = functions.inRoleData (role,req);

    if (res) {
      return `${field} ${res}`;
    }

    return res;
  },

  inRoleData: function (role, req) {

    let roles = req.auth.roles && req.auth.roles[role];

    if (roles) {
      roles = Array.isArray(roles) && roles || [roles];
      if (_.find(roles, v => {
          return v === '*'
        })) {
        return;
      }
      roles = `'${roles.join("','")}'`;

      return `in (${roles})`;
    } else {
      return false;
    }

  }

};


export default functions;
