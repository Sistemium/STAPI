export {logErrorRequestToFile};

import fs from 'fs';
import _ from 'lodash';
const uuidV4 = require('uuid').v4;

const folder = process.env.LOG_ERROR_REQUEST_FOLDER;

function logErrorRequestToFile(err, req, res, next) {

  if (!err) {
    return next();
  }

  if (folder) {

    let prefix = _.first(req.originalUrl.match(/[^/]+\/[^/]+$/)) || 'undefined';

    let fileName = `${folder}/${prefix.replace(/[^a-z0-9]/ig, '-')}-${uuidV4()}.json`;

    fs.writeFile(fileName, err.body, err => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Request written to "${fileName}"`);
      }
    });

  }

  console.error(err.message, req.headers);
  next({text: err.message});

}
