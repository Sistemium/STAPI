/**
 * Main application routes
 */

'use strict';

import errors from './components/errors';
import path from 'path';
import auth from './middleware/auth';
import extractPool from './middleware/extractPool';

export default function (app) {
  // Insert routes below
  app.use('/api/sts', require('./api/sts'));
  app.use('/api/admin/map', require('./api/admin'));
  app.use('/api/:pool', extractPool(), auth(), require('./api/domain'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  app.route('/*')
    .get((req, res) => {
      res.send(404);
    });
}
