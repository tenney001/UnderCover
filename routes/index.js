var express = require('express');
var router = express.Router();
var room = require('../Model/Room');
var config = require('../config');
var db = config.getDB();
//Todo 用Async来做异步流程控制。
//var roomList = [];


/* GET home page. */
router.get('/', function(req, res, next) {
  //var userCollection = db.get('usercollection');
  //userCollection.find({},{},function(err,data){
  //    if(err){
  //      console.log(err);
  //      res.end();
  //    }
  //    console.log(data);
      res.render('index', { title: '谁是卧底-首页',classindex:0});
  //});
});

//关于我们
router.get('/about', function(req, res, next) {
  res.render('about', { title: '谁是卧底-关于我们',classindex:1 });
});

//新闻
router.get('/news', function(req, res, next) {
  res.render('news', { title: '谁是卧底-新闻',classindex:2 });
});

//联系我们
router.get('/contact', function(req, res, next) {
  res.render('contact', { title: '谁是卧底-联系我们',classindex:3 });
});

//登录get
router.get('/login', function(req, res, next) {
  res.render('login', { title: '谁是卧底-登录',classindex:4,pagemsg:'' });
});
//登录post
router.post('/login', function(req, res, next) {
  var user = {
    username:req.body.username,
    password:req.body.password
  }
  var userModel = db.get('userModel');
  userModel.find({'username':user.username,'password':user.password},{},function(err,data){
    if(err)res.render('login', { title: '谁是卧底-登录',classindex: 4, pagemsg: '登录异常' });
    if(data && data.length>0){
      req.session.username = user.username;
      console.log(req.session)
      res.render('login', { title: '谁是卧底-登录',classindex: 4, pagemsg: '登录成功' });
    }else{
      res.render('login', { title: '谁是卧底-登录',classindex:4,pagemsg:'用户名或密码错误' });
    }
  });

});

router.get('/register', function(req, res, next) {
  res.render('register', { title: '谁是卧底-注册',classindex:4 ,pagemsg: ''});
});


router.post('/register', function(req, res, next) {
  var user = {
    username:req.body.username,
    password:req.body.password
  };
  var userModel = db.get('userModel');
  var user_rs;
  userModel.find({'username':user.username},{},function(err,data){
    if(err){
      console.log(err);
      res.render('register', { title: '谁是卧底-注册',classindex: 4, pagemsg: '注册异常' });
    }
    user_rs = data;
    console.log(user_rs);
    if(user_rs && user_rs.length>0){
      res.render('register', { title: '谁是卧底-注册',classindex: 4, pagemsg: '用户名已被注册，请换一个用户名' });
    }else{
      userModel.insert(user,{}, function (err,data) {
        if(err){
          console.log(err);
          res.render('register', { title: '谁是卧底-注册',classindex: 4, pagemsg: '注册异常' });
        }
        console.log("insert-rs-data:",data);
        if(data){
          res.render('register', { title: '谁是卧底-注册',classindex: 4, pagemsg: '注册成功' });
        }else{
          res.render('register', { title: '谁是卧底-注册',classindex: 4, pagemsg: '注册失败' });
        }
      })
    }
  });
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
