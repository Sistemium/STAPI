'use strict';

var express = require('express');
var controller = require('./domain.controller.js');
import headersToParams from '../../middleware/headersToParams';
import validateParams from '../../middleware/validateParams';

var router = express.Router();

router.get('/:id?', headersToParams(), validateParams(), controller.index);
//router.put('/', controller.put);
router.post('/', headersToParams(), validateParams(), controller.post);

router.head('/:id?', headersToParams(), validateParams(), controller.index);

module.exports = router;
