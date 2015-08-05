/**
 * Created by Tenney on 15/8/4.
 */


var roomState = require('./RoomState');

//谁是卧底，游戏控制器
var UC_GameController = function(){
    //this.room = room;
    this.minUser = 4;                   //游戏最少人数；
    this.State = roomState.Room_Waiting;
}


UC_GameController.prototype = {
    setRoom:function(room){
        this.room = room;
    },
    //游戏开始
    start:function(){
        if(room.numUser >= this.minUser){
            //start
            //Todo start;
            this.State = roomState.Room_GameStart;

        }else{
            //失败,并返回原因。
        }
    }
}


module.exports = UC_GameController;