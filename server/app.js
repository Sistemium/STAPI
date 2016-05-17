/**
 * Main application file
 */

'use strict';
import express from 'express';
import config from './config/environment';

import http from 'http';
import registerPlugins from './components/plugins/registerPlugins';
import domainConfig from './components/orm/domainConfigsParser';
import path from 'path';
// Setup server
var app = express();
var server = http.createServer(app);

import debug from 'debug';
debug.log = console.info.bind(console);

import expressConfig from './config/express';
expressConfig (app);

import routesConfig from './routes';
routesConfig (app);

// Start server
function startServer() {
  server.listen(config.port, config.ip, function () {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
}

/**
 * read configuration from specified folder or default folder is server/domain
 */

domainConfig(path.normalize(path.join(config.root, process.env.DOMAIN_CONFIG)) || `${__dirname}/domain`, (map) => {
  app.locals.domainConfig = map;
});
setImmediate(startServer);

// Expose app
exports = module.exports = app;
