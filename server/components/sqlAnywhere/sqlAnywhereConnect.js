"use strict";

require('epipebomb')();

// const debug = require('debug')('stapi:sqlAnywhere');
const sqlanywhere = require('sqlanywhere');
const connParams = process.argv[2];
const conn = sqlanywhere.createConnection();

require('./errorHandlers')(conn);

conn.name = process.argv.length > 3 ? process.argv[3] : 'unnamed';

function parseError(saError) {

  let err = saError.toString();

  try {
    return {
      code: err.match(/Code: ([^ ]*)/)[1],
      text: err.match(/Msg: (.*)/)[1]
    }
  } catch (e) {
    return {
      code: '',
      text: err
    }
  }

}

conn.connect(connParams, function (err) {

  if (err) {
    process.send({connectError: parseError(err)});
  } else {
    conn.connectedAt = new Date();
    process.send('connected');
  }

});

process.on('message', function (m) {

  //debug ('message',m);

  if (m.sql) {

    let cb = function (err, res) {

      if (err) {
        m.error = parseError(err);
        process.send(m);
      } else {
        if (!m.autoCommit) {
          m.result = res;
          return process.send(m);
        }
        conn.commit(function (err) {
          if (err) {
            m.error = parseError(err);
          } else {
            m.result = res || 0;
          }
          process.send(m);
        });
      }
    };

    conn.exec(m.sql, m.params || [], cb);

  } else if (m === 'rollback') {

    conn.rollback(function (err) {
      if (err) {
        m = {error: parseError(err)}
      } else {
        m = 'rolled back'
      }
      process.send(m);
    });

  } else if (m === 'commit') {

    conn.commit(function (err) {
      if (err) {
        m = {error: parseError(err)}
      } else {
        m = 'committed';
      }
      process.send(m);
    });

  }

});

