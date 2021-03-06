/**
 * Created by Tenney on 2015-07-21.
 */

var roomState = require('./RoomState');
var roomType = require('./roomType');
var UC_GameController = require('./UC_GameController');
var config = require('../config'),
    db = config.getDB(),
    roomModel = db.get('roomModel');


var Room = function(){
    this.roomId = "";                           //房间号
    this.roomName = "";          //房间名称
    this.roomType = "";            //房间游戏类型
    this.roomMaster = "";                         //房间管理员ID
    this.maxUser = 8;                               //房间最大人数
    this.users = [];                                //当前房间人员
    this.numUser = 0;                               //当前房间人数
    this.roomState = roomState.Room_Waiting;        //房间状态
    this.roomPassword = "";                         //房间密码
    this.createTime = "";       //房间创建时间
    this.roomGameController = null;         //房间游戏控制器
    this.socketsArr = [];                                  //房间内socket集合

    this.socketGroup = null;                               //房间使用的socket对象


}

Room.prototype = {
    //初始化房间。
    initRoom:function(roomName,roomType,userid,maxUser,roomPassword,gameController){
        this.roomId = "";                           //房间号
        this.roomName = roomName;          //房间名称
        this.roomType = roomType;            //房间游戏类型
        this.roomGameController = gameController;       //游戏控制器
        this.roomMaster = userid;                         //房间管理员
        this.maxUser = maxUser;                               //房间最大人数
        this.users = [];                                //当前房间人员
        this.numUser = 0;                               //当前房间人数
        this.roomState = roomState.Room_Waiting;        //房间状态
        this.roomPassword = roomPassword;                         //房间密码
        this.createTime = (new Date()).getTime();       //房间创建时间
        this.socketGroup = null;                               //房间使用的socket对象组
        this.socketsArr = [];                                  //房间内玩家socket集合
    },
    //用数据库查出的对象转换为room对象。
    dbToRoom:function(room){
        if(!room){
            return null;
        }
        this._id = room._id;                           //房间id
        this.roomId = room.roomId ? room.roomId : room._id.toString();  //房间号
        this.roomName = room.roomName;          //房间名称
        this.roomType = room.roomType;            //房间游戏类型
        this.roomMaster = room.roomMaster;                         //房间管理员
        this.maxUser = room.maxUser;                               //房间最大人数
        this.users = room.users ? room.users : [];                                //当前房间人员
        this.numUser = room.numUser;                               //当前房间人数
        this.roomState = room.roomState;        //房间状态
        this.roomPassword = room.roomPassword;                         //房间密码
        this.createTime = room.createTime;       //房间创建时间
        this.roomGameController = room.roomGameController;         //房间游戏控制器

        this.socketGroup = room.socketGroup;                               //房间使用的socket对象组
        this.socketsArr = room.socketsArr;                  //房间内玩家socket集合

        return this;
    },
    //利用房间ID，设置房间socket分组
    setRoomSocketGroup:function(id){
        this.socketGroup = '/room/'+id;
        return this;
    },
    //加入房间。
    joinRoom:function(socket,pwd,socket_Arr,callback){

        var user = socket.handshake.session.user;
        var errObj = {rs:true};
        //判断是否能进入房间。
        if(this.numUser>=this.maxUser){
            console.log('room-join-err:房间人数已满.');
            errObj = {rs:"err",msg:"加入被拒绝：房间人数已满."};
        }
        else if(this.roomPassword!=pwd){
            console.log('room-join-err:房间密码错误.');
            errObj = {rs:"err",msg:"加入被拒绝：房间密码错误."};
        }
        else if(this.roomState == roomState.Room_GameStart){
            console.log('room-join-err:游戏已经开始.');
            errObj = {rs:"err",msg:"加入被拒绝：游戏已经开始."};
        }
        if(errObj.rs == "err"){
            callback(errObj);
        }else{
            //判断user是否在房间，如果不在，将user存入房间，并将房间号存入user
            var flag = false;
            for(var i=0;i<this.users.length;i++){
                if(this.users[i]._id == user._id){
                    flag = true;
                    break;
                }
            }
            if(!flag){
                //将user装入房
                this.users.push(user);
                user.roomId = this.roomId;
            }
            //将当前socket对象装入socket集合。
            socket_Arr[socket.handshake.session.user._id] = socket;
            this.socketsArr.push(socket.handshake.session.user._id);


            // socket_Arr[socket.handshake.session.userGameData.nickname] = socket;
            // this.socketsArr = socket_Arr;
            this.numUser = this.users.length;
            //加入分组
            socket.join(this.socketGroup);
            //发送消息给分组成员
            socket.broadcast.to(this.socketGroup).emit('server message', "欢迎 "+user.nickname+" 进入房间");


            this.saveRoom(callback);
        }


    },
    //退出房间。
    leaveRoom:function(socket,callback){
        var self = this;
        var user = socket.handshake.session.user;
        //todo 房间人员-1，并且删除房间的该人员，该人员的房间ID号需要清空。
        var tempArr  = [];
        for(var i=0;i<self.users.length;i++){
            if(self.users[i]._id == user._id){
                self.users.splice(i,1);
                break;
            }
        }

        //todo 判断离开房间的是不是房主，如果是，需要变更房主。
        if(self.roomMaster == user._id && self.users.length>0){
            self.roomMaster = self.users[0]._id;
        }

        for(var i=0;i<self.socketsArr.length;i++){
            if(self.socketsArr[i] == socket.handshake.session.user._id){
                self.socketsArr.splice(i,1);
                break; 
            }
        }

        self.numUser = self.users.length;

        //todo 发送一个命令到客户端，执行跳转到大厅。
        // socket.emit('service order',{order_type:"url",order_code:"/gameLobby"});

        self.saveRoom(callback);
    },
    //开始游戏
    getStart:function(){
        //变更房间状态，并装载控制器，游戏启动。
        var self = this;
        self.roomState = roomState.Room_GameStart;
        var gameController = new UC_GameController();
        // self.saveRoom(function () {
        return gameController.start(self);
        // });
    },
    //数据持久化
    saveRoom:function(callback) {
        var self = this;
        roomModel.updateById(self.roomId, self, {}, function (err, data) {
            if (err) {
                console.log("saveRoom-err:", err);
            }
            if (data) {
                // console.log("saveRoom:", data);
                if (typeof callback == "function") {
                    // callback(self);
                    callback(self);
                }
            }
        });
    }

}


//获取room
Room.getRoomById = function (id, callback) {
    var self = this;
    roomModel.findById(id, {}, function (err, data) {
        if (err) {
            console.log("getRoomById-err:", err);
        }
        if (data) {
            console.log("getRoomById:", data);
            if (typeof callback == "function") {
                callback(data);
            }
        }
    });
}



module.exports = Room;