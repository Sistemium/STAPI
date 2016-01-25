'use strict';

var express = require('express');
var controller = require('./admin.controller.js');

var router = express.Router();

router.get('/:pool?/:entity?', controller.index);

module.exports = router;
