'use strict';

var express = require('express');
var controller = require('./agent.controller');

var router = express.Router();

router.get('/', controller.index);
//router.put('/', controller.put);
router.post('/', controller.post);

module.exports = router;
