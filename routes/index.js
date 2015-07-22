var express = require('express');
var router = express.Router();
var room = require('../Model/Room');
//var config = require('../config');
//var roomList = [];


/* GET home page. */
router.get('/', function(req, res, next) {
  //var db = config.getDB();
  //console.log(db);
  res.render('index', { title: '谁是卧底-首页',classindex:0});
});
router.get('/about', function(req, res, next) {
  res.render('about', { title: '谁是卧底-关于我们',classindex:1 });
});
router.get('/news', function(req, res, next) {
  res.render('news', { title: '谁是卧底-新闻',classindex:2 });
});
router.get('/contact', function(req, res, next) {
  res.render('contact', { title: '谁是卧底-联系我们',classindex:3 });
});
router.get('/login', function(req, res, next) {
  res.render('login', { title: '谁是卧底-登录',classindex:4 });
});
router.get('/register', function(req, res, next) {
  res.render('register', { title: '谁是卧底-注册',classindex:4 });
});


/* POST doLogin. */
router.post('/doLogin',function(req,res,next){
  //var db = config.getDB();
  //var usercollection = db.get('usercollection');
  //usercollection.find({},{},function(err,data){
  //  if(err){
  //    console.log(err);
  //    res.end();
  //  }
  //  var nickName = req.body.nickName;
  //  console.log(req.session);
  //  req.session.nickName = nickName;
  //  console.info(data)
  //  res.render('room',{title:'游戏房间',nickName:nickName,data:data});
  //})
});


module.exports = router;
