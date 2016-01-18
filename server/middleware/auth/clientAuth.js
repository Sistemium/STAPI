'use strict';

import config from '../../config/environment';
const authUrl = config.stAuthUrl;
const request = require('request');

// переделать на хранение в redis с автоочисткой по expiresAt
var authorizedTokens = {};
var badTokens = {};

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
    if (auth.account.org === org || auth.roles.admin) {
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
        console.log('checkOrgAuth');
        next();
      } else {
        res.status(403).end();
      }

    };

    var token = req.headers.authorization;

    if (!token || badTokens[token]) {
      res.status(401).end();
    } else if (authorizedTokens[token]) {
      checkRoles(authorizedTokens[token]);
    } else {
      authByToken(token).then(function (res) {
        console.log('Auth account success:', res.account);
        checkRoles(authorizedTokens[token] = res);
      }, function () {
        badTokens[token] = true;
        res.status(401).end();
      });
    }
  };

}
