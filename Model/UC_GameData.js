/**
 * Created by Tenney on 15/7/27.
 */


var userGameModel = require("../config").getDB().get('userGameModel');

//谁是卧底游戏user资料数据模型
var UC_GameData = function(user){
    this.userId = user._id;     //userId
    this.nickname = user.nickname;         //昵称
    this.roomId = "";           //房间ID
    this.level = 1;             //等级
    this.exp = 0;               //经验值
    this.points = 0;            //点数
    this.civilians = 0;        //作为平民的局数
    this.underCover = 0;            //作为卧底的局数
    this.winCount = 0;           //胜利局数
    this.failureCount = 0;          //失败局数
}

UC_GameData.getUserById = function (id, callback) {
    userGameModel.findById(id, {}, function (err, data) {
        if (err) {
            console.log("getUserById-err:", err);
        }
        return callback(data);
    });
}


UC_GameData.getUserByUserId = function (id, callback) {
    userGameModel.find({userId:id}, {}, function (err, data) {
        if (err) {
            console.log("getUserById-err:", err);
        }
        return callback(data[0]);
    });
}

//数据持久化
UC_GameData.prototype.save = function(callback) {
    var self = this;
    userGameModel.update({userId:self.userId}, self, {}, function (err, data) {
            if (err) {
                console.log("saveUC_GameData-err:", err);
            }
            if (data) {
                // console.log("saveRoom:", data);
                if (typeof callback == "function") {
                    // callback(self);
                    callback(self);
                }
            }
        });
};

UC_GameData.prototype.getAward = function(identity,winnerState) {
    if(identity=="civilians" && winnerState=="winner"){
        //作为平民获胜
        this.exp += 10;
        this.points += 3;
        this.winCount++;
        this.civilians++;
    }else if(identity=="underCover" && winnerState=="winner"){
        // 作为卧底获胜
        this.exp += 20;
        this.points += 5;
        this.winCount++;
        this.underCover++;
    }else if(identity=="civilians" && winnerState!="winner" ){
        // 作为平民失败
        this.exp += 3;
        this.failureCount++;
        this.civilians++;
    }else if(identity=="underCover" && winnerState!="winner"){
        // 作为卧底失败
        this.exp += 5;
        this.failureCount++;
        this.underCover++;
    }

    //每个等级100经验值递增
    if(this.exp >= 100*this.level){
        this.exp -= 100*this.level;
        this.level++;
    }
    return this;
}

module.exports = UC_GameData;

