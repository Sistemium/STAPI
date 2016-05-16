'use strict';
import _ from 'lodash';

export default function () {
  return function (req, res, next) {

    var isValid = true;

    _.each(req['x-params'], (param, key) => {
      if (key && key.match(/[^-_$@a-z0-9 :]/ig)) {
        res.status(400).end(`Param value cannot contain symbols except: "-_$@a-z0-9 :"`);
        return (isValid = false);
      }
    });

    return isValid && next();
  }
}
