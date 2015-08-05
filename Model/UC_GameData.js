/**
 * Created by Tenney on 15/7/27.
 */


//谁是卧底游戏user资料数据模型
var UC_GameData = function(user){
    this.userId = user._id;     //userId
    this.nickname = user.nickname;         //昵称
    this.level = 1;             //等级
    this.exp = 0;               //经验值
    this.points = 0;            //点数
    this.roomId = "";           //房间ID
}


module.exports = UC_GameData;