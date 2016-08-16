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
import RequestHttpClient from 'request';
import winston from 'winston';
import expressWinston from 'express-winston';
import getPoolByName from '../components/pool';
import url from 'url';

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

  expressWinston.requestWhitelist.push('body');
  expressWinston.responseWhitelist.push('body');

  app.use(expressWinston.logger({
    transports: [
      new winston.transports.Console({
        json: true,
        colorize: true
      })],
    colorStatus: true
  }));

  //  register the 'after response' middleware
  app.use(function (request, response, done) {


    // console.log(response);

    // let pool = getPoolByName()
    //  define our postProcessor
    //  we do this here as we automatically get to access the
    //  request and response arguments
    function postProcess() {
      //  remove the event listeners, ensuring postProcess
      //  only gets called once
      response.removeListener('finish', postProcess);
      response.removeListener('close', postProcess);

      let pool = getPoolByName(request.pool);

      function fullUrl(req) {

        return url.format({
          protocol: req.protocol,
          port: req.port || 9000,
          hostname: req.hostname,
          pathname: req.originalUrl
        });
      }

      let logRequestsUrl = pool.config.logRequests;

      if (logRequestsUrl) {

        if (fullUrl(request) === logRequestsUrl) {
          return done();
        } else {

          // we still have access to the request and response
          // variables provided when the our middleware is
          // called (we registered registered the function with
          // request, response and done arguments).

          let requestLogData = {
            resource: request.path,
            params: request.params,
            method: request.method,
            requestBody: request.body,
            responseBody: response.body,
            status: response.statusCode,
            authorization: request.authorization || request.headers.authorization
          };

          winston.log('info', 'logRequests', requestLogData);

          RequestHttpClient({
              url: logRequestsUrl,
              method: 'POST',
              json: true,
              headers: {
                "content-type": "application/json"
              },
              body: requestLogData
            }, function (error, response, body) {
              if (error) {
                winston.log('error', `error: ${error}`);
              }

              winston.log('info', `response: ${JSON.stringify(response)}`);
              winston.log('info', `body: ${JSON.stringify(body)}`);
            }
          );
        }

      } else {

        console.log(
          //  the user agent
          request.headers['user-agent'],
          //  the requested path
          request.path,
          //  the HTTP status code returned
          response.statusCode
        );

      }

    }

    //  listen for the finish and close events, pass those on to
    //  the postProcess method
    response.on('finish', postProcess);
    response.on('close', postProcess);

    if (done)
      done();

  });
}
