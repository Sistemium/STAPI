/**
 * Main application file
 */

'use strict';

import express from 'express';
import config from './config/environment';
import http from 'http';
import path from 'path';
import debug from 'debug';

import domainConfig from './components/orm/domainConfigsParser';

// Setup server
const app = express();
const server = http.createServer(app);

debug.log = console.info.bind(console);

require('./components/plugins/registerPlugins');
require('./config/express')(app);
require('./routes')(app);

// Start server
function startServer() {
  server.listen(config.port, config.ip, function () {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

/**
 * read configuration from specified folder or default folder is server/domain
 */

const configPath = path.normalize(path.join(config.root, process.env.DOMAIN_CONFIG)) || `${__dirname}/domain`;

domainConfig(configPath, (map) => app.locals.domainConfig = map);

setImmediate(startServer);

// Expose app
exports = module.exports = app;
