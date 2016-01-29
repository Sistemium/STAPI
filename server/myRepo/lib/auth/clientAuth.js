'use strict';

import config from '../../../config/environment';
const authUrl = config.stAuthUrl;
const request = require('request');
const debug = require('debug')('stapi:clientAuth');

// переделать на хранение в redis с автоочисткой по expiresAt

var LRU = require("lru-cache");
var lruOptions = {
  max: process.env.AUTH_LRU_MAX || 1000,
  maxAge: process.env.AUTH_LRU_MAX_AGE || 1000 * 5 * 60
};
var authorizedTokens = LRU(lruOptions);
var badTokens = LRU(lruOptions);

var authByToken = function (token) {

  var options = {
    url: authUrl,
    headers: {
      authorization: token
    }
  };

  return new Promise(function (resolve, reject) {

    request.get(options, function (err, res, body) {

      var jsonBody;

      try {
        jsonBody = JSON.parse(body);
      } catch (x) {
        jsonBody = false;
      }

      if (!err && res.statusCode == 200 && jsonBody) {
        resolve(jsonBody);
      } else {
        reject(res.statusCode || err);
      }

    });

  });

};

var checkOrgAuth = function (org, auth) {

  try {
    if (auth.account.org === org || auth.roles.admin || auth.roles[org]) {
      return true;
    }
  } catch (e) {
    return false;
  }

  return false;

};

export default function () {

  if (!authUrl) {
    return function (req, res, next) {
      next();
    }
  }

  return function (req, res, next) {

    var checkRoles = function (auth) {

      if (checkOrgAuth(req.pool, auth)) {
        req.auth = auth;
        next();
      } else {
        res.status(403).end();
      }

    };

    var token = req.headers.authorization;

    debug('clientAuth', token);
    if (!token || badTokens.get(token)) {
      return res.status(401).end();
    }

    let authorized = authorizedTokens.get(token);

    if (authorized) {
      checkRoles(authorized);
    } else {
      authByToken(token).then(function (res) {
        console.log('Auth account success:', res.account && res.account.name);
        authorizedTokens.set(token, res)
        checkRoles(res);
      }, function () {
        debug('Auth account error:', token);
        badTokens.set(token, true);
        res.status(401).end();
      });
    }
  };

}
