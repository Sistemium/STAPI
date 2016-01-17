'use strict';

var express = require('express');
var controller = require('./domain.controller.js');
import headersToParams from '../../middleware/headersToParams';
import validateParams from '../../middleware/validateParams';
import auth from '../../middleware/auth';

var router = express.Router();

router.get('/:id?', auth(), headersToParams(), validateParams(), controller.index);
//router.put('/', controller.put);
router.post('/', headersToParams(), validateParams(), controller.post);

router.head('/:id?', auth(), headersToParams(), validateParams(), controller.index);

module.exports = router;
