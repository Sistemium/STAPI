import {getPoolByName} from '../components/pool';
import url from 'url';
import RequestHttpClient from 'request';
import config from '../config/environment';
import _ from 'lodash';
const SL_BODY_LENGTH_MAX = config.slBodyLengthMax;

export default function (request, response, done) {

  //  define our postProcessor
  //  we do this here as we automatically get to access the
  //  request and response arguments
  function postProcess() {
    //  remove the event listeners, ensuring postProcess
    //  only gets called once
    response.removeListener('finish', postProcess);
    response.removeListener('close', postProcess);

    let pool = getPoolByName(request.pool);

    if (!pool) {
      return done('Incorrect pool name...');
    }

    function fullUrl(req) {

      return url.format({
        protocol: req.protocol,
        port: req.port || 9000,
        hostname: req.hostname,
        pathname: req.originalUrl
      });
    }

    let logRequestsUrl = pool.config.logRequests;

    if (logRequestsUrl) {

      if (fullUrl(request) === logRequestsUrl) {
        return done();
      } else {

        let responseBody = response.body || '';
        let responseBodyLength = responseBody.toString().length;

        if (responseBodyLength > SL_BODY_LENGTH_MAX) {
          responseBody = {
            error: `Response length exceeds the max length: ${SL_BODY_LENGTH_MAX}`
          };
        }

        let requestBody = request.body || '';
        let requestBodyLength = requestBody.toString().length;

        if (requestBodyLength > SL_BODY_LENGTH_MAX) {
          requestBody = {
            error: `Request length exceeds the max length: ${SL_BODY_LENGTH_MAX}`
          };
        }

        let accountName = _.get(request.auth, 'account.name');
        let requestLogData = {
          resource: `${request.pool}/${_.get(request, 'params.collection')}`,
          params: request.params,
          method: request.method,
          requestBody,
          responseBody,
          status: response.statusCode,
          authorization: request.authorization || _.get(request, 'headers.authorization'),
          instanceName: config.instanceName,
          query: request.query,
          accountName: accountName || 'anonymous'
        };

        RequestHttpClient({
            url: logRequestsUrl,
            method: 'POST',
            json: true,
            headers: {
              'content-type': 'application/json'
            },
            body: requestLogData,
            timeout: config.slTimeout
          }, error => {
            if (error) {
              console.error(`error: ${error}`);
            }
          }
        );
      }
    }
  }

  //  listen for the finish and close events, pass those on to
  //  the postProcess method
  response.on('finish', postProcess);
  response.on('close', postProcess);

  if (done)
    done();

};
