'use strict';

var express = require('express');
var controller = require('./sts.controller');

var router = express.Router();

router.post('/:server', controller.post);

module.exports = router;
