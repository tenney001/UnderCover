/**
 * Created by Tenney on 15/8/5.
 */

var config = require('../config'),
    db = config.getDB(),
    UC_GameData = require('./UC_GameData');
    Room = require('./Room'),
    roomState = require("./RoomState");
    UC_GameController = require("./UC_GameController");
    //socket连接集合
    socket_Arr = [],
    //room数据库映射
    roomModel = db.get('roomModel');
var uc_GameController = new UC_GameController();
var the_room = new Room();


var socketHandler = function(socket){
    //room.socket = socket;
    //Todo 运用socket的session，判断登录用户。如果未登录，则断开。
    var socket_session = socket.handshake.session;
    if(!socket_session || !socket_session.userGameData){
        socket.emit('service msg',"请先登录。。");
        socket.disconnect();
    }
    //console.log("a user connect.. the socket session is:",socket.handshake.session);
    //console.log("this user's user:",socket.handshake.session.user);
    //console.log("this user's userGameData:",socket.handshake.session.userGameData);

    //加入房间
    addRoom(socket);
    
}

//加入房间
function addRoom (socket) {
    // body...
    //todo 将socket按roomId进行分组。
    var user =socket.handshake.session.userGameData;

    if(user.roomId){
        //获取房间
        roomModel.find({_id:user.roomId},{},function(err,roomlist){
            if(err){
                console.log("roomModel-err:",err);
            }
            if(roomlist.length>=1){
                var room = new Room();
                //设置房间分组
                room = room
                    .dbToRoom(roomlist[0])
                    .setRoomSocketGroup(room.roomId);

                //todo 重复加入房间问题处理。
                for(var i=0;i<room.users.length;i++){
                    if(room.users[i].userId == user.userId){
                        socket.emit('server message', "不能重复加入房间");
                        socket.disconnect();
                        userLeave(socket,room,user);
                        return false;
                    }
                }

                // var join_rs = room.joinRoom(user,"");
                room.joinRoom(socket,"",socket_Arr,function (_room) {
                    if(_room.rs ==  "err"){
                        socket.emit('service order',{order_type:"get_out",order_code:_room.msg});
                        // socket.disconnect();
                        return false;
                    }else{

                        //设置当前房间
                        the_room = _room;
                        //更新页面信息
                        updatePageInfo(_room,socket);

                        //当触发‘chat message’时
                        socket.on('chat message',function(msg){
                            if(room.roomState != roomState.Room_GameStart){
                                msg = user.nickname + " : "+msg;
                                console.log("msg from user :",msg);
                                socket.broadcast.to(room.socketGroup).emit('chat message', msg);
                                socket.emit('chat message',msg);
                            }
                        })
                        //当客户端发来命令时
                        socket.on('client order',function (msgObj) {
                            switch(msgObj.order_type){
                                case "game_start":
                                    game_start(the_room,socket);
                                break;
                            }
                        })

                        //当连接关闭时
                        socket.on('disconnect',function(){
                            userLeave(socket,room,user);
                        });

                        //当用户离开房间时
                        socket.on('out_room',function(){
                            socket.emit("service order",{order_type:"url",order_code:"/gameLobby"});
                            socket.disconnect();
                        })
                    }
                });
            }
        })
    }else {
        socket.emit('server message',"获取房间失败。。");
        socket.disconnect();
    }
}

//更新页面信息
function updatePageInfo(room,socket,backfun){
    //更新房主
    UC_GameData.getUserByUserId(room.roomMaster,function(data){
        if(data){
            socket.emit('service order', {order_type:"roomMaster",order_code:data.nickname});
            socket.broadcast.to(room.socketGroup).emit('service order', {order_type:"roomMaster",order_code:data.nickname});
        }
    })
    //更新用户列表
    socket.emit('service order', {order_type:"userList",order_code:room.users});
    socket.broadcast.to(room.socketGroup).emit('service order', {order_type:"userList",order_code:room.users});
    room.saveRoom(backfun);
}

//用户离开时
function userLeave(socket,room,user){
    Room.getRoomById(room.roomId, function (rs_room_data) {
        room = room.dbToRoom(rs_room_data);
        room.leaveRoom(user, function (roomobj) {
            //判断房间是否空置，如果没人，删除房间
            if(roomobj.users.length==0){
                roomModel.remove({_id:room._id});
            }
            //用户离开
            //socket.emit("service order",{order_type:"url",order_code:"/gameLobby"});
            socket.handshake.session.userGameData.roomId = "";
            console.log("a user disconnected");
            socket.broadcast.to(room.socketGroup).emit('server message', " "+user.nickname+" 离开房间");
            //更新页面信息
            updatePageInfo(room,socket);
        });
    });
}

function game_start (_room,socket) {
    Room.getRoomById(_room._id,function (rs_room_data) {
        var room = rs_room_data;
        if(room.numUser < uc_GameController.minUser){
            socket.emit("service order",{order_type:"start_failure",order_code:"还没有达到游戏开始要求，最少人数需要"+uc_GameController.minUser+"人"});
        }else if(room.roomState == roomState.Room_GameStart){
            socket.emit("service order",{order_type:"start_failure",order_code:"游戏已经开始"});
        }else if(room.roomMaster != socket.handshake.session.user._id){
            socket.emit("service order",{order_type:"start_failure",order_code:"没有权限"});
        }else{
            socket.emit("server message","正在启动游戏");
            var rs = _room.getStart();
            if(rs && !rs.rs){
                socket.emit("service order",{order_type:"start_failure",order_code:rs.msg});
            }else{
                _room.saveRoom();
            }
        }
    })
}


// //发送消息
// function sendMsg (socket,users,sType,msgStr) {
//     socket.emit(sType,msgStr);
// }


module.exports = socketHandler;

