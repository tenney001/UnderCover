/**
 * Created by Tenney on 15/8/5.
 */

var config = require('../config'),
    db = config.getDB(),
    Room = require('./Room');


var socketHandler = function(socket){
    //room.socket = socket;
    //Todo 运用socket的session，判断登录用户。如果未登录，则断开。
    if(!socket.handshake.session || !socket.handshake.session.userGameData){
        socket.emit('service msg',"请先登录。。");
        socket.disconnect();
    }

    //todo 重复登录，重复打开房间问题处理。


    //console.log("a user connect.. the socket session is:",socket.handshake.session);
    //console.log("this user's user:",socket.handshake.session.user);
    //console.log("this user's userGameData:",socket.handshake.session.userGameData);

    //todo 将socket按roomId进行分组。
    var user =socket.handshake.session.userGameData;

    if(user.roomId){
        //获取房间
        roomModel = db.get('roomModel');
        roomModel.find({_id:user.roomId},{},function(err,roomlist){
            if(err){
                console.log("roomModel-err:",err);
            }
            if(roomlist.length>=1){
                var room = new Room();
                room.dbToRoom(roomlist[0]);
                //设置房间分组
                room.setRoomSocketGroup(room.roomId);
                room.joinRoom(user,"");
                //加入分组
                socket.join(room.socketGroup);
                //发送消息给分组成员
                socket.broadcast.to(room.socketGroup).emit('server message', "欢迎 "+user.nickname+" 进入房间");

                //当触发‘chat message’时
                socket.on('chat message',function(msg){
                    msg = user.nickname + " : "+msg;
                    console.log("msg from user :",msg);
                    socket.broadcast.to(room.socketGroup).emit('chat message', msg);
                    socket.emit('chat message',msg);
                })

                //当连接关闭时
                socket.on('disconnect',function(){
                    console.log("a user disconnected");
                    socket.broadcast.to('room_'+user.roomId).emit('server message', " "+user.nickname+" 离开房间");
                });
            }
        })
    }else {
        socket.emit('service msg',"获取房间失败。。");
        socket.disconnect();
    }
}

module.exports = socketHandler;