'use strict';

var express = require('express');
var controller = require('./domain.controller.js');

var router = express.Router();

router.get('/:id?', controller.index);
//router.put('/', controller.put);
router.post('/', controller.post);

module.exports = router;
