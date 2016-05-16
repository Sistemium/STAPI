'use strict';

import config  from '../../config/environment';
import request from 'request';

export function post (req, res) {

  let server = req.params.server;

  let url = config.sts[server];

  if (!url) {
    res.status(404).end('Unknown server');
  }

  request.post({
    url: url + '/api/msg',
    json: req.body
  })
    .pipe(res);

}
