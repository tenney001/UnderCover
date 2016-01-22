var express = require('express');
var router = express.Router();
var UserModel = require('../Model/User');
var UserGameData = require('../Model/UC_GameData');
var Room = require('../Model/Room');
var ProxyKeywords = require('../Model/ProxyKeywords');
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
  var user = new UserModel();
  user.username = req.body.username;
  user.password = req.body.password;

  var userModel = db.get('userModel');
  userModel.find(user,{},function(err,data){
    if(err)res.render('login', { title: '谁是卧底-登录',classindex: 4, pagemsg: '登录异常' });
    if(data && data.length>0){
      req.session.user = data[0];
      console.log(req.session)
      //res.render('login', { title: '谁是卧底-登录',classindex: 4, pagemsg: '登录成功' });
      res.redirect('/gameLobby');
    }else{
      res.render('login', { title: '谁是卧底-登录',classindex:4,pagemsg:'用户名或密码错误' });
    }
  });

});

router.get('/register', function(req, res, next) {
  res.render('register', { title: '谁是卧底-注册',classindex:4 ,pagemsg: ''});
});


router.post('/register', function(req, res, next) {
  var user = new UserModel();
  user.username = req.body.username;
  user.password = req.body.password;
  user.nickname = req.body.nickname;
  var userModel = db.get('userModel');
  var user_rs;
  userModel.find({'username':user.username},{},function(err,data){
    if(err){
      console.log(err);
      res.render('register', { title: '谁是卧底-注册',classindex: 4, pagemsg: '注册异常' });
    }
    user_rs = data;
    if(user_rs && user_rs.length>0){
      res.render('register', { title: '谁是卧底-注册',classindex: 4, pagemsg: '用户名已被注册，请换一个用户名' });
    }else{

      userModel.find({'nickname':user.nickname},{},function(err2,nickname_data) {
        if (err2) {
          console.log(err2);
          res.render('register', {title: '谁是卧底-注册', classindex: 4, pagemsg: '注册异常'});
        }
        user_rs2 = data;
        if(user_rs2 && user_rs2.length>0){
          res.render('register', { title: '谁是卧底-注册',classindex: 4, pagemsg: '昵称已被注册，请换一个昵称' });
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

    }
  });
});


//游戏大厅
router.get('/gameLobby',function(req,res,next){
  if(req.session && req.session.user){
    var roomModel = db.get('roomModel');
    roomModel.find({},{},function(err,data){
      if(err){
        console.log(err);
        res.end();
      }
      res.render('gameLobby',{title:"游戏大厅",classindex:4,data:data,user:req.session.user});
    });
  }else{
    res.redirect('/login');
  }
})


/* 进入房间. */
router.get('/room/:id',function(req,res,next){
  var usersession = req.session;
  if(!usersession || !usersession.user){
    res.redirect('/login');
  }
  var userdata = usersession.user;
  //获取user的游戏数据。
  var userGameData;
  var userGameModel = db.get('userGameModel');
  userGameModel.find({userId:userdata._id},{},function(err,data){
    if(err){
      console.log("userGameModel-db-err:",err);
      res.end();
    }
    if(data.length>=1){
      userGameData = data[0];
    }else{
      userGameData = new UserGameData(req.session.user);
      userGameModel.insert(userGameData,{},function(err,userGamedata){
        if(err){
          console.log("room-db-err:",err);
          res.end();
        }
        if(userGamedata){

        }
      })
    }
    var id = req.param('id');
    if(id == 'undefined'){
      res.end();
      return false;
    }
    var roomModel = db.get('roomModel');
    roomModel.find({_id:id},{},function(err,roomdata){
      if(err){
        console.log("room-db-err:",err);
        res.end();
      }
      //判断是否可以进入房间。
      //ToDo 判断是否可以进入房间。
      if(!roomdata){
        console.log("房间已经失效");
        res.redirect("/gameLobby");
      }

      //设置房间socket分组，然后进入房间。
      var room = new Room();
      room.dbToRoom(roomdata[0]);
      userGameData.roomId = room.roomId;
      req.session.userGameData = userGameData;

      UserGameData.getUserByUserId(room.roomMaster,function(data){
        console.log("getRoomMaster-data:",data);
        res.render('room',{roomMaster:data,room:room,user:userdata});
      })
    });
  })

});


//添加关键词
router.get('/keywords',function(req,res,next){
  if(req.session && req.session.user){
    var proxyKeywords = new ProxyKeywords();
    proxyKeywords.getWords({authorId:req.session.user._id},function (data) {
      res.render('keywords',{ title: '我的关键词',classindex: 4, pagemsg: '',data:data });
    });
  }else{
    res.redirect('/login');
  }
})

router.post('/keywords',function (req,res,next) {
  if(req.session && req.session.user){
    var proxyKeywords = new ProxyKeywords();
    proxyKeywords.word1 = req.body.word1;
    proxyKeywords.word2 = req.body.word2;
    proxyKeywords.word3 = req.body.word3;
    proxyKeywords.word4 = req.body.word4;
    proxyKeywords.word5 = req.body.word5;
    proxyKeywords.auditState = 0;
    proxyKeywords.authorId = req.session.user._id;

    proxyKeywords.addWords(function (rs_data) {
      console.log(rs_data);
      // res.render('addKeywords',{title: '我的关键词',classindex: 4, pagemsg: '',data:rs_data});
      res.redirect('/keywords');
    });

  }else{
    res.redirect('/login');
  }
})


module.exports = router;
