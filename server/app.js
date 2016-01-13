/**
 * Main application file
 */

'use strict';

import express from 'express';
import config from './config/environment';
import http from 'http';
import domainConfig from './config/domainConfig';

// Setup server
var app = express();
var server = http.createServer(app);
require('./config/express')(app);
require('./routes')(app);

// Start server
function startServer() {
    server.listen(config.port, config.ip, function () {
        console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
    });
}

app.locals.domainConfig = domainConfig(`${__dirname}/domain`, {js: true, json: false});
setImmediate(startServer);

// Expose app
exports = module.exports = app;
