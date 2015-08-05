/**
 * Created by Tenney on 2015-07-21.
 */

var roomState = require('./RoomState');
var roomType = require('./roomType');
var UC_GameController = require('./UC_GameController');


var Room = function(){
    this.roomId = "";                           //房间号
    this.roomName = "";          //房间名称
    this.roomType = "";            //房间游戏类型
    this.roomMaster = "";                         //房间管理员
    this.maxUser = 8;                               //房间最大人数
    this.users = [];                                //当前房间人员
    this.numUser = 0;                               //当前房间人数
    this.roomState = roomState.Room_Waiting;        //房间状态
    this.roomPassword = "";                         //房间密码
    this.createTime = "";       //房间创建时间
    this.roomGameController = null;         //房间游戏控制器

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
    },
    //用数据库查出的对象转换为room对象。
    dbToRoom:function(room){
        this.roomId = room._id.toString();                           //房间号
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

        this.socketGroup = room.socketGroup;                               //房间使用的socket对象
    },
    //利用房间ID，设置房间socket分组
    setRoomSocketGroup:function(id){
        this.socketGroup = '/room/'+id;
    },
    //加入房间。
    joinRoom:function(user,pwd){
        //判断是否能进入房间。
        if(this.numUser>=this.maxUser){
            console.log('room-join-err:房间人数已满.');
            return false;
        }
        if(this.roomPassword!=pwd){
            console.log('room-join-err:房间密码错误.');
            return false;
        }
        //将user存入房间，并将房间号存入user
        this.users.push(user);
        user.roomId = this.roomId;

        this.numUser = this.users.length;
        if(this.maxUser==this.numUser){
            this.roomState = roomState.Room_GameStart;
            //根据房间游戏类型，装载对应的游戏控制器，并启动。
            this.getStart();

        }
        return true;
    },
    //退出房间。
    leaveRoom:function(user){
        //todo 判断离开房间的是不是房主，如果是，需要变更房主。

        //todo 房间人员-1，并且删除房间的该人员，该人员的房间ID号需要清空。

        //todo 发送一个命令到客户端，执行跳转到大厅。
    },
    //开始游戏
    getStart:function(){
        var gameController = new UC_GameController();
        gameController.setRoom(this);
        gameController.start();
    }
}





module.exports = Room;