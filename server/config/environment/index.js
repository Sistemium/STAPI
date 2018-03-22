'use strict';

import path from 'path';
import _ from 'lodash';

function requiredProcessEnv(name) {
  if (!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}

// All configurations will extend these options
// ============================================
const all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(__dirname + '/../../..'),

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  slBodyLengthMax: process.env.SL_BODY_LENGTH_MAX || 2500,
  slTimeout: process.env.SL_TIMEOUT || 10000,

  instanceName: process.env.INSTANCE_NAME,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: 'session'
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./shared'),
  require('./' + process.env.NODE_ENV + '.js') || {});
