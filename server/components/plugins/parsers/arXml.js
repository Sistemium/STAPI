'use strict';

const _ = require('lodash');
const parseString = require('xml2js').parseString;

let dtConvert = function (type){
  if (type.match (/^(decimal)$/)) {
    return parseFloat;
  } else if (type.match(/^(i|integer|int)$/)) {
    return parseInt;
  } else {
    return function(v) {
      return v;
    };
  }
};

exports.fromARObject = function fromARObject (xml) {

  var result = {};

  // {"Object":{"i":{"_":"20","$":{"name":"cnt"}},"decimal":{"_":"2.5","$":{"name":"avgSeconds"}}}}

  parseString (xml, {explicitChildren:false}, function (err,res) {

    if (err) {
      return false;
    }

    try {
      _.each(res.Object, function (val,key) {
        _.each (val,function (item) {
          result[item.$.name] = dtConvert(key)(item._);
        });
      });
    } catch (e) {
      console.error('fromARObject:', e);
      return false;
    }
  });

  return result;

};

exports.fromARArray = function fromARArray (xml) {

  var result = [];

  if (!xml.match (/^<Array>/)) {
    xml = `<Array>${xml}</Array>`;
  }

  parseString (xml, {explicitChildren:true}, function (err,res) {

    if (err) {
      return false;
    }

    try {

      _.each(res.Array.$$.d, function (d) {

        let obj = {};

        _.each (d.$,function (val, key) {
          if (key === 'xid') {
            obj.id = val;
          } else {
            obj[key] = val;
          }
        });

        _.each(d.$$, function (val,key) {
          _.each (val,function (item) {
            obj[item.$.name] = dtConvert(key)(item._);
          });
        });

        result.push (obj);

      });

      return result;

    } catch (e) {
      console.error ('fromARArray:', e);
      return false;
    }

  });

  return result;

};
