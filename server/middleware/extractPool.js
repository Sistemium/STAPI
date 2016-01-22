'use strict';

export default function () {
  return function (req, res, next) {

    req.pool = req.params.pool.toLowerCase();

    if (req.pool === undefined) {
      return res.status(404).end('no pool');
    }

    next();

  }
};
