'use strict';

let _ = require('lodash');
let xml2js = require('xml2js');

exports.fromARObject = function fromARObject (xml) {

  var result = {};

  xml2js.parseString (xml, function (err,res) {
    // {"Object":{"i":{"_":"20","$":{"name":"cnt"}},"decimal":{"_":"2.5","$":{"name":"avgSeconds"}}}}

    xml2js.parseString (xml, {explicitChildren:false, explicitArray:false}, function (err,res) {

      if (err) {
        return false;
      }

      try {
        _.each(res.Object, function (val) {
          result[val.$.name] = val._;
        });
      } catch (e) {
        console.error('fromARObject:', e);
        return false;
      }
    });

  });

  return result;

};

exports.fromARArray = function fromARArray (xml) {
  var result = [];
  xml2js.parseString (xml, {explicitChildren:true}, function (err,res) {

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

        _.each(d.$$.s, function (s) {
          obj[s.$.name] = s._;
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
