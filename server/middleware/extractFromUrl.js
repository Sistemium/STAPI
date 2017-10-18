'use strict';

export default function () {
  return function (req, res, next) {

    let collection = req.params.collection.toLowerCase();

    try {

      if (collection === undefined) {
        res.status(404).end('no collection');
      }

      let keyInMap = `${req.pool}/${collection}`;
      let appLocals = req.app.locals;
      let domainConfig = appLocals && appLocals.domainConfig && appLocals.domainConfig.get(keyInMap);

      if (!appLocals) {
        return res.status(404).end('no appLocals');
      } else if (!domainConfig) {
        return res.status(404).end('no domainConfig');
      }

      //expose request-level config
      res.locals.config = domainConfig;

    } catch (err) {
      console.error(`extractFormUrl error at path: /api/${req.pool}/${collection}`);
      return next(err);
    }
    next();
  }
};
