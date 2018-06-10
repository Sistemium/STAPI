export {logErrorRequestToFile, logSuccessRequestToFile};

import fs from 'fs';
import _ from 'lodash';
import {getPoolByName} from '../components/pool';

const uuidV4 = require('uuid').v4;
const debug = require('debug')('stapi:logRequestToFile');

const errorFolder = process.env.LOG_ERROR_REQUEST_FOLDER;
const successFolder = process.env.LOG_SUCCESS_REQUEST_FOLDER;

function logErrorRequestToFile(err, req, res, next) {

  debug('logErrorRequestToFile:', errorFolder);

  writeToFile(errorFolder, err.toString(), req);

  next({ text: err.message });

}

function logSuccessRequestToFile(req, res, next) {

  const { body } = req;

  if (!body.length && !Object.keys(body).length) {
    return next()
  }

  debug('logSuccessRequestToFile:', req.pool);

  try {

    let { config: { logToFolder } } = getPoolByName(req.pool);

    if (logToFolder) {
      debug('logSuccessRequestToFile:', successFolder, logToFolder);
      writeToFile(`${successFolder}/${logToFolder}`, body, req);
    }

  } catch (e) {
    next(e)
  }

  next();

}

function writeToFile(folder, json, req) {

  let prefix = _.first(req.originalUrl.match(/[^/]+\/[^/]+$/)) || 'undefined';

  let fileName = `${folder}/${prefix.replace(/[^a-z0-9]/ig, '-')}-${uuidV4()}.json`;

  fs.writeFile(fileName, JSON.stringify(json), err => {
    if (err) {
      console.error(err);
    } else {
      debug('written to:', fileName);
    }
  });

}
