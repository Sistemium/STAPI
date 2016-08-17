import getPoolByName from '../components/pool';
import url from 'url';
import RequestHttpClient from 'request';
import config from '../config/environment';
import _ from 'lodash';

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

        let accountName = _.get(req.auth, 'account.name');
        let requestLogData = {
          resource: `${request.pool}/${request.params.collection}`,
          params: request.params,
          method: request.method,
          requestBody: request.body,
          responseBody: response.body,
          status: response.statusCode,
          authorization: request.authorization || request.headers.authorization,
          instanceName: config.name,
          query: request.query,
          accountName: accountName
        };

        RequestHttpClient({
            url: logRequestsUrl,
            method: 'POST',
            json: true,
            headers: {
              "content-type": "application/json"
            },
            body: requestLogData
          }, function (error) {
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
