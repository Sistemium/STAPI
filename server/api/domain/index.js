'use strict';

var express = require('express');
var controller = require('./domain.controller.js');
import headersToParams from '../../middleware/headersToParams';
import validateParams from '../../middleware/validateParams';
import extractFromUrl from '../../middleware/extractFromUrl';
import modifyBody from '../../middleware/modifyBody';
import validateModel from '../../middleware/validateModel';

var router = express.Router();
var mw = [extractFromUrl(), headersToParams(), validateParams()];
var bm = [modifyBody(), validateModel(), controller.post];

router
  .get ('/:collection/:id?', mw, controller.index)
  .post('/:collection/:id?', mw, bm)
  .put ('/:collection/:id?', mw, bm)

  .get ('/:filterCollection/:filterCollectionId/:collection/:id?', mw, controller.index)
  .post('/:filterCollection/:filterCollectionId/:collection/:id?', mw, bm)
  .put ('/:filterCollection/:filterCollectionId/:collection/:id?', mw, bm)
;

module.exports = router;
