'use strict';

var express = require('express');
var controller = require('./domain.controller.js');
import headersToParams from '../../middleware/headersToParams';
import validateParams from '../../middleware/validateParams';
import extractFromUrl from '../../middleware/extractFromUrl';
import modifyBody from '../../middleware/modifyBody';

var router = express.Router();
var mw = [extractFromUrl(), headersToParams(), validateParams()];

router
  .get('/:collection/:id?', mw, controller.index)
  .post('/:collection', mw, modifyBody(), controller.post)
  .put('/:collection/:id?', mw, modifyBody(), controller.post)
  .get('/:filterCollection/:filterCollectionId/:collection', mw, controller.index)
;

module.exports = router;
