/**
 * Created by Tenney on 2015-07-21.
 */


    var userModel = require("../config").getDB().get('userModel');

var User = function(){
    this.username;
    this.password;
    this.nickname;
}

User.getUserById = function (id, callback) {
    userModel.findById(id, {}, function (err, data) {
        if (err) {
            console.log("getUserById-err:", err);
        }
        return callback(data);
    });
}


module.exports = User;