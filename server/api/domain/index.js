'use strict';

var express = require('express');
var controller = require('./domain.controller.js');
import headersToParams from '../../middleware/headersToParams';
import validateParams from '../../middleware/validateParams';
import extractFromUrl from '../../middleware/extractFromUrl';

var router = express.Router();
var mw = [extractFromUrl(), headersToParams(), validateParams()];

router
  .get('/:collection/:id?', mw, controller.index)
  .post('/:collection', mw, controller.post)
  .get('/:filterCollection/:filterCollectionId/:collection', mw, controller.index)
;

module.exports = router;
