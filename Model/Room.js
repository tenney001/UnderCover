/**
 * Created by Tenney on 2015-07-21.
 */

var roomState = require('./RoomState');

var Room = function(user){
    this.roomId = roomId;                           //房间号
    this.roomMaster = user;                         //房间管理员
    this.maxUser = 8;                               //房间最大人数
    this.numUser = 1;                               //当前房间人数
    this.roomState = roomState.Room_Waiting;        //房间状态
    this.socket = {};                               //房间使用的socket对象
}

Room.prototype.Start = function(){

}





module.exports = Room;