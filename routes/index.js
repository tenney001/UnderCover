var express = require('express');
var router = express.Router();
var room = require('../Model/Room');
var config = require('../config');
var roomList = [];


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '谁是卧底-测试版' });
});

/* POST doLogin. */
router.post('/doLogin',function(req,res,next){
  var db = config.getDB();
  var usercollection = db.get('usercollection');
  usercollection.find({},{},function(err,data){
    if(err){
      console.log(err);
      res.end();
    }
    var nickName = req.body.nickName;
    console.log(req.session);
    req.session.nickName = nickName;
    console.info(data)
    res.render('room',{title:'游戏房间',nickName:nickName,data:data});
  })
});


module.exports = router;
