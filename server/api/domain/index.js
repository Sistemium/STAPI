'use strict';

import express from 'express';
import headersToParams from '../../middleware/headersToParams';
import validateParams from '../../middleware/validateParams';
import extractFromUrl from '../../middleware/extractFromUrl';
import modifyBody from '../../middleware/modifyBody';
import validateModel from '../../middleware/validateModel';
import modelPredicates from '../../middleware/modelPredicates';
import modelConfig from '../../middleware/modelConfig';
import auth from '../../middleware/auth';

const controller = require('./domain.controller.js');

const router = express.Router();
const mw = [
  extractFromUrl(), auth('auth'),
  headersToParams(), validateParams(), modelConfig('join'), modelPredicates(),
  cacheControl
];
const bm = [modifyBody(), validateModel(), controller.post];

router
  .get('/:collection/:id?', mw, controller.index)
  .post('/:collection/:id?', mw, bm)
  .put('/:collection/:id?', mw, bm)
  .patch('/:collection/:id?', mw, bm)
  .delete('/:collection/:id', mw, controller.del)

  .get('/:filterCollection/:filterCollectionId/:collection/:id?', mw, controller.index)
  .post('/:filterCollection/:filterCollectionId/:collection/:id?', mw, bm)
  .put('/:filterCollection/:filterCollectionId/:collection/:id?', mw, bm)
  .patch('/:filterCollection/:filterCollectionId/:collection/:id?', mw, bm)
  .delete('/:filterCollection/:filterCollectionId/:collection/:id?', mw, controller.del)
;

module.exports = router;

function cacheControl(req, res, next) {

  let {config} = res.locals;

  if (config && config.caching === false) {
    res.header('Cache-Control', 'no-cache');
  }

  next();

}
