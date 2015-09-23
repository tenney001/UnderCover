var express = require('express');
var router = express.Router();
var RoomModel = require('../Model/Room');
var UC_GameController = require('../Model/UC_GameController');
var JsonData = require('../Model/JsonData');
var config = require('../config');
var db = config.getDB();
//Todo 用Async来做异步流程控制。
//var roomList = [];


//创建房间
router.post('/createRoom', function(req, res, next) {
  var rsData = new JsonData();
  var roomJson = req.body;
  if(!req.session || !req.session.user){
    rsData.state = 'error';
    rsData.data = null;
    rsData.msg = "您还没有登录";
    res.json(rsData);
  }
  var room = new RoomModel();
  var roomName = roomJson.roomName ? roomJson.roomName : req.session.user.nickname+"的房间";
  var roomType = roomJson.roomType;
  var userid = req.session.user._id;
  var maxUser = roomJson.maxUser;
  var roomPassword = roomJson.roomPassword;
  var gameController = new UC_GameController();
  room.initRoom(roomName,roomType,userid,maxUser,roomPassword,gameController);

  var roomDB = db.get("roomModel");
  roomDB.insert(room,{},function(err,data){
    if(err){
      console.log("createRoom-db-err:",err);
      res.end();
    }
    if(data){
      rsData.state = 'ok';
      rsData.data = data;
      rsData.msg = '';
      res.json(rsData);
    }
  });
});


router.get('/createRoom', function(req, res, next) {
  console.log("in this ajax get.");
  res.json({a:1});
  res.end();
});

module.exports = router;
