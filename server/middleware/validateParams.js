'use strict';
const _ = require('lodash');

export default function () {
  return function (req, res, next) {

    _.each(req['x-params'], (param, key) => {
      if (key) {
        if (key.match(/[^-_$@a-z0-9 :]/ig)) {
          console.log(`Invalid key in params: ${key}`);
          res.status(400).end(`Param value cannot contain symbols except: "-_$@a-z0-9 :"`);
        }
      }
    });
    next();
  }
}
