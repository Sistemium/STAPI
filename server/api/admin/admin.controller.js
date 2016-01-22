'use strict';

export function index(req, res) {
  return res.json(req.app.locals);
}
