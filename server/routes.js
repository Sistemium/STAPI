/**
 * Main application routes
 */

'use strict';

import errors from './components/errors';
import auth from './middleware/auth';
import extractPool from './middleware/extractPool';
import {logSuccessRequestToFile} from "./middleware/logFiles";

export default function (app) {

  const pool = [extractPool(), auth('middleware')];

  if (process.env.LOG_SUCCESS_REQUEST_FOLDER) {
    pool.push(logSuccessRequestToFile);
  }

  pool.push(require('./api/domain'));

  app.use('/api/sts', require('./api/sts'));
  app.use('/api/admin/map', require('./api/admin'));
  app.use('/api/:pool', pool);

  // All undefined asset or api routes should return a 404
  app.route('/:url(auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  app.route('/*')
    .get((req, res) => {
      res.sendStatus(404);
    });
}
