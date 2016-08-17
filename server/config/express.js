/**
 * Express configuration
 */

'use strict';

import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import bodyParser from 'body-parser';
import errorHandler from 'errorhandler';
import path from 'path';
import config from './environment';
import cors from 'cors';
import logResponseBody from '../middleware/logResponseBodyMiddleware';
import afterResponse from '../middleware/afterResponseMiddleware';


export default function (app) {
  var env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.set('view engine', 'jade');
  app.use(compression());
  app.use(cors({
    allowedHeaders: ['X-Page-Size', 'X-Start-Page', 'Authorization', 'Content-Type', 'X-Return-Post'],
    exposedHeaders: ['X-Aggregate-Count', 'X-Offset']
  }));
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json({limit: process.env.JSON_LIMIT || '100kb'}));

  app.set('appPath', path.join(config.root, 'client'));

  if ('production' === env) {
    //app.use(favicon(path.join(config.root, 'client', 'favicon.ico')));
    app.use(express.static(app.get('appPath')));
    app.use(morgan(process.env.MORGAN || 'dev'));
  }

  if ('development' === env) {
    app.use(require('connect-livereload')({
      port: 35731
    }));
  }

  if ('development' === env || 'test' === env) {
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(app.get('appPath')));
    app.use(morgan(process.env.MORGAN || 'dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }

  app.use(logResponseBody);
  //  register the 'after response' middleware
  app.use(afterResponse);
}
