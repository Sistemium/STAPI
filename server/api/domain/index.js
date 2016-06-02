'use strict';

var express = require('express');
var controller = require('./domain.controller.js');
import headersToParams from '../../middleware/headersToParams';
import validateParams from '../../middleware/validateParams';
import extractFromUrl from '../../middleware/extractFromUrl';
import modifyBody from '../../middleware/modifyBody';
import validateModel from '../../middleware/validateModel';
import modelPredicates from '../../middleware/modelPredicates';
import modelConfig from '../../middleware/modelConfig';


var router = express.Router();
var mw = [extractFromUrl(), headersToParams(), validateParams(), modelConfig('join'), modelPredicates()];
var bm = [modifyBody(), validateModel(), controller.post];

router
  .get ('/:collection/:id?', mw, controller.index)
  .post('/:collection/:id?', mw, bm)
  .put ('/:collection/:id?', mw, bm)
  .patch('/:collection/:id?', mw, bm)
  .delete('/:collection/:id', mw, controller.del)

  .get ('/:filterCollection/:filterCollectionId/:collection/:id?', mw, controller.index)
  .post('/:filterCollection/:filterCollectionId/:collection/:id?', mw, bm)
  .put ('/:filterCollection/:filterCollectionId/:collection/:id?', mw, bm)
  .patch('/:filterCollection/:filterCollectionId/:collection/:id?', mw, bm)
  .delete('/:filterCollection/:filterCollectionId/:collection/:id?', mw, controller.del)
;

module.exports = router;
