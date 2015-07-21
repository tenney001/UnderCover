/**
 * Created by Tenney on 15/7/22.
 */

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/test_db1');

var config = function () {

};

config.getDB = function(){
    return db;
}


module.exports = config;