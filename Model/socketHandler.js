/**
 * Created by Tenney on 15/8/5.
 */

var config = require('../config'),
    db = config.getDB(),
    UC_GameData = require('./UC_GameData');
    Room = require('./Room'),
    //socket连接集合
    socket_Arr = [],
    //room数据库映射
    roomModel = db.get('roomModel');


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
                    }else{
                        //将当前socket对象装入socket集合。
                        socket_Arr[socket_session.userGameData.nickname] = socket;
                    }
                }

                var join_rs = room.joinRoom(user,"");
                if(join_rs.rs == "err"){
                    socket.emit('server message',join_rs.msg);
                    socket.disconnect();
                    return false;
                }else{
                    room = join_rs.data;
                }
                console.log("room:",room);
                //加入分组
                socket.join(room.socketGroup);
                //发送消息给分组成员
                socket.broadcast.to(room.socketGroup).emit('server message', "欢迎 "+user.nickname+" 进入房间");

                //更新页面信息
                updatePageInfo(room,socket);

                //当触发‘chat message’时
                socket.on('chat message',function(msg){
                    msg = user.nickname + " : "+msg;
                    console.log("msg from user :",msg);
                    socket.broadcast.to(room.socketGroup).emit('chat message', msg);
                    socket.emit('chat message',msg);
                })

                //当连接关闭时
                socket.on('disconnect',function(){
                    userLeave(socket,room,user);
                });
            }
        })
    }else {
        socket.emit('server message',"获取房间失败。。");
        socket.disconnect();
    }
}

//更新页面信息
function updatePageInfo(room,socket){
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
            console.log("a user disconnected");
            socket.broadcast.to(room.socketGroup).emit('server message', " "+user.nickname+" 离开房间");
            //更新页面信息
            updatePageInfo(room,socket);
        });
    });
}


module.exports = socketHandler;