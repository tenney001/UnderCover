/**
 * Created by Tenney on 15/8/4.
 */


var roomState = require('./RoomState');
var UC_GameData = require('./UC_GameData');
var ProxyKeywords = require('./ProxyKeywords');

//谁是卧底，游戏控制器
var UC_GameController = function(){

    var ALLSOCKETS = [];           //游戏中的socket
    //this.room = room;
    this.minUser = 4;                   //游戏最少人数；
    this.State = roomState.Room_Waiting;
    this.room = null;           //装载游戏控制器的房间
    this.userEnabledNum = 0;    //处于游戏中状态的玩家数量
    this.socketsArrEnalbed = [];    //处于游戏中状态的玩家socket连接。（不包含出局的）
    this.voteArr = [];              //投票存储容器

    this.getAllSockets = function(){
        return ALLSOCKETS;
    }
    this.setAllSockets = function (sockets) {
        ALLSOCKETS = sockets;
    }
}


UC_GameController.prototype = {
    setRoom:function(room){
        this.room = room;
    },
    //游戏开始
    start:function(room){
        if(room.numUser >= this.minUser){
            //start
            //Todo start;
            this.State = roomState.Room_GameStart;
            this.setRoom(room);
            // console.log("game start ..");
            // console.log("room-sockets",room.socketsArr);
            var socketsArr = room.socketsArr;
            this.gameInit(socketsArr);
        }else{
            //失败,并返回原因。
            return {rs:false,msg:"房间人数不足"}
        }
    },
    gameInit:function (socketsArr) {
        var self = this;
        //游戏初始化
        
        var so_arr = [];
        for(so in socketsArr){
            //初始化属性
            socketsArr[so].isEnabled = true;
            //设置允许描述
            socketsArr[so].describeWordsState = true;
            //设置允许投票
            socketsArr[so].voteState = true;
            //设置允许发言
            socketsArr[so].sayHi = true;
            //设置阵亡状态
            socketsArr[so].alive = true;

            //初始化事件
            //收到客户端命令
            socketsArr[so].on("client order",function (msgObj) {
                // {order_type:"describeWords",order_code:""}
                switch(msgObj.order_type){
                    case "describeWords":
                        if(this.alive && this.describeWordsState){
                            this.emit("server message",{order_type:"describeWords",order_code:"你(No."+this.gameNumber+")的描述为：“"+msgObj.order_code+"”"});
                            this.broadcast.to(self.room.socketGroup).emit("server message",{order_type:"describeWords",order_code:this.handshake.session.userGameData.nickname+"No."+this.gameNumber+" 的描述为：“"+msgObj.order_code+"”"});
                            self.describeWords(self.socketsArrEnalbed);
                        }
                        break;
                    case "vote":
                        if(this.alive && this.voteState){
                            //todo 验证投票
                            self.vote(msgObj.order_code,this,self.round_result);
                        }
                        break;
                }
            })
            //收到客户端消息
            socketsArr[so].on("chat message",function (msgObj) {
                if(this.alive && this.sayHi){
                    self.sendMsg(self.room.socketsArr,"chat message",msgObj);
                }
            });
            so_arr.push(socketsArr[so]);
        }
        //将游戏参与者随机排序
        socketsArr = so_arr.sort(this.randomSort);
        //添加玩家编号
        for(var i=0;i<socketsArr.length;i++){
            socketsArr[i].gameNumber = i+1;
        }
        //通知大家游戏开始
        this.sendMsg(socketsArr,"server message","游戏开始");
        //获取关键词
        this.getWords(function (words) {
            //发送关键词
            self.sendWords(socketsArr,words);
        });

        //将所有玩家socket装入容器备用
        this.setAllSockets(this.soObjToArr(this.room.socketsArr));
        this.socketsArrEnalbed = this.getAllSockets();


    },
    //获取关键词
    getWords:function (callback) {
        var self = this;
        var proxyKeywords = new ProxyKeywords();
        proxyKeywords.getWords({},function (rs_data) {
            if(rs_data && rs_data.length>0){
                var rs_len = rs_data.length;
                var num = Math.floor(Math.random()*rs_len);
                var index1;
                var index2;
                do{
                    index1 = Math.floor(Math.random()*5);
                    index2 = Math.floor(Math.random()*5);
                }while(index1==index2 || index1>=rs_len || index2>=rs_len)
                var str = [rs_data[num]["word"+(index1+1)],rs_data[num]["word"+(index2+1)]];
                if(typeof callback =="function"){
                    callback.call(self,str);
                }
            }
        });
        // var str = ["冬瓜","南瓜"];
        // return str;
    },
    //给大家发送广播
    sendMsg:function (socketsArr,msgType,msg) {
        //遍历socketsArr，给客户端发送信息
        for(socket in socketsArr){
            //给大家发送消息
            //投票判断权限
            if(msgType=="vote" && socketsArr[socket].vote){
                socketsArr[socket].emit(msgType, msg);
            }else{
                socketsArr[socket].emit(msgType, msg);
            }
        }
    },
    //分发关键词
    sendWords:function (socketsArr,words) {
        //遍历socketsArr，给客户端发送信息
        var n = Math.random() * 100;
        n = Math.floor(n%this.room.numUser);
        var k =0;
        for(socket in socketsArr){
            if(socketsArr[socket].un_words){
                if(socketsArr[socket].alive){
                    socketsArr[socket].emit('server message', "您的关键词是："+socketsArr[socket].un_words);
                    k++
                }
            }else if(words){
                if(k==n){
                    socketsArr[socket].emit('server message', "您的关键词是："+words[0]);
                    socketsArr[socket].un_words = words[0];
                    socketsArr[socket].unState = true;
                }else{
                    socketsArr[socket].emit('server message', "您的关键词是："+words[1]);
                    socketsArr[socket].un_words = words[1];
                    socketsArr[socket].unState = false;
                }
                k++;
            } 
        }
        this.userEnabledNum = k;
        this.setAllSockets(socketsArr);

        //关键词发送完毕，由大家开始描述
        this.describeWords(this.socketsArrEnalbed);
    },
    //随机排序
    randomSort:function(a,b) {
        //用Math.random()函数生成0-1之间的随机数，与0.5比较，返回-1或1
        return Math.random()>0.5 ? -1 : 1;
    },
    //描述关键词
    describeWords:function (socketsArr) {
        //循环发言描述
        //将socket对象转换成数组集合
        socketsArr = this.soObjToArr(socketsArr);
        if(socketsArr.length>0){
            //根据玩家No.号码排序
            socketsArr = socketsArr.sort(function (a,b) {
                return parseInt(a.gameNumber) > parseInt(b.gameNumber);
            });
            this.socketsArrEnalbed = socketsArr;
            var so = this.socketsArrEnalbed.shift();
            //判断权限
            if(so.alive && so.describeWordsState){
                so.emit('server message',"现在由你开始描述，你有30秒描述时间。");
                so.broadcast.to(this.room.socketGroup).emit('server message',"现在由"+so.handshake.session.userGameData.nickname+"开始描述，他有30秒描述时间。");
                so.emit('service order', {order_type:"describeWords",order_code:""});
            }else{
                //todo 这里需要继续执行流程。例如提示当前玩家已经出局，由下一位继续描述。
                this.describeWords(socketsArr);
            }
        }else{
            this.socketsArrEnalbed = this.getAllSockets();
            this.voteArr.length = 0;
            
            // if(so.alive && so.voteState){
                this.sendMsg(this.room.socketsArr,'server message',"描述结束，现在进入投票环节。请输入你要投票的号码，然后发送。");
                this.sendMsg(this.room.socketsArr,"service order",{order_type:"vote",order_code:""});
            // }
        }
    },
    //投票环节
    vote:function(num,socket){
        //循环检查投票
        var voteObj = {isEnabled:false,number:num};
        //提取数字
        num = num.toString().replace(/[^0-9]/ig,"");
        num = parseInt(num);
        //验证投票是否有效
        if(num){
            for(var i=0;i<this.socketsArrEnalbed.length;i++){
                if(this.socketsArrEnalbed[i].gameNumber == num && this.socketsArrEnalbed[i].alive){
                    voteObj.isEnabled = true;
                    voteObj.number = num;
                }
            }
        }
        //将验证后的投票对象装入容器
        if(voteObj.isEnabled){
            socket.emit("server message",{order_type:"vote",order_code:"你的投票为：“No."+voteObj.number+"”"});
        }else{
            socket.emit("server message",{order_type:"vote",order_code:"你的投票无效,视为弃权"});
        }
        this.voteArr.push(voteObj);
        //如果所有人都已经投票，那么进入下一个环节
        if(this.voteArr.length==this.userEnabledNum){
            //执行完毕，进入下一步
            this.sendMsg(this.room.socketsArr,'server message',"投票结束，正在计算结果。");
            this.sendMsg(this.room.socketsArr,"round_result","");
            this.round_result();
        }
    },
    //统计回合结果
    round_result:function () {
        // body...
        // console.log("现在开始统计结果。。");
        var arr = [];
        var voteArr =  this.voteArr
        for(v in voteArr){
            if(voteArr[v].isEnabled){
                arr.push(voteArr[v].number);
            }
        }
        this.sendMsg(this.room.socketsArr,'server message',"有效的投票为："+arr.toString());
        var round_rs=this.getRoundRs(arr);

        //判断是否有多个并列
        var voteName = "";
        var tied = false;
        for(var i=0;i<round_rs.length;i++){
            if(i==0){
                voteName += "No."+round_rs[i].vote;
            }else{
                voteName += "和No."+round_rs[i].vote;
                tied = true;
            }
        }
        this.sendMsg(this.room.socketsArr,'server message',"得票最高的是："+voteName+",票数为："+round_rs[0].count+"票");

        if(tied){
            //如果有并列票数，本轮投票忽略，继续进入下一轮
            this.sendMsg(this.room.socketsArr,'server message','由于有票数并列第一，本轮没有人出局，继续下一轮');
            this.theNextTurn();
        }else{
            var so_arr = this.getAllSockets();
            var isCiviliansWinner = false;
            var gameEnalbedUserNumber = 0;
            for(var i=0;i<so_arr.length;i++){
                if(so_arr[i].gameNumber == round_rs[0].vote){
                    //判断是否为卧底，如果是，游戏结束，平民胜利
                    if(so_arr[i].unState){
                        //卧底被找到，游戏结束，平民胜利。
                        this.room.roomState = roomState.Room_GameOver;
                        this.sendMsg(this.room.socketsArr,'server message','卧底被找到，游戏结束，平民获胜。。');
                        this.sendMsg(this.room.socketsArr,'server message','卧底被找到，游戏结束，平民获胜。。');
                        this.sendMsg(this.room.socketsArr,'server message','卧底被找到，游戏结束，平民获胜。。');
                        isCiviliansWinner = true;
                        this.getAward("civilians");
                        break;
                    }else{
                        //本轮结果提示信息
                        this.sendMsg(this.room.socketsArr,'server message','No.'+so_arr[i].gameNumber+'被集体投票出局，可惜他并不是卧底，游戏继续。');
                        this.sendMsg(this.room.socketsArr,'server message','No.'+so_arr[i].gameNumber+'被集体投票出局，可惜他并不是卧底，游戏继续。');
                        this.sendMsg(this.room.socketsArr,'server message','No.'+so_arr[i].gameNumber+'被集体投票出局，可惜他并不是卧底，游戏继续。');
                        so_arr[i].emit('server message','你已被投票出局，当前不能发言和投票，直到游戏结束。');
                        so_arr[i].emit('server message','你已被投票出局，当前不能发言和投票，直到游戏结束。');
                        so_arr[i].emit('server message','你已被投票出局，当前不能发言和投票，直到游戏结束。');

                        //如果不是卧底，则阵亡
                        //设置阵亡
                        so_arr[i].alive = false;
                        //禁止描述关键词
                        so_arr[i].describeWordsState = false;
                        //禁止投票
                        so_arr[i].voteState = false;
                        //禁止发言
                        so_arr[i].sayHi = false;
                    }
                }
                //统计剩余玩家数量
                if(so_arr[i].alive){
                    gameEnalbedUserNumber++;
                }
            }
            //如果剩余游戏玩家数量小于3，并且平民没有胜利，则卧底胜利
            if(gameEnalbedUserNumber<3 && !isCiviliansWinner){
                //卧底没被找到，游戏结束，卧底胜利。
                this.room.roomState = roomState.Room_GameOver;
                this.sendMsg(this.room.socketsArr,'server message','卧底没被找到，游戏结束，卧底获胜。。');
                this.sendMsg(this.room.socketsArr,'server message','卧底没被找到，游戏结束，卧底获胜。。');
                this.sendMsg(this.room.socketsArr,'server message','卧底没被找到，游戏结束，卧底获胜。。');
                this.getAward("underCover");
            }
            //如果剩余游戏玩家数量大于3，并且平民没有胜利，则游戏继续。
            else if(gameEnalbedUserNumber>2 && !isCiviliansWinner){
                //将阵亡人员信息更新后的集合装入容器
                this.setAllSockets(so_arr);

                //进入下一轮
                this.theNextTurn();
            }
        }


    },
    //将socket对象转换成数组集合
    soObjToArr:function (soObj) {
        if(typeof soObj[0] == "object")return soObj;
        var arr = [];
        for(so in soObj){
            arr.push(soObj[so]);
        }
        return arr;
    },
    //计算投票结果
    getRoundRs:function (arr) {
        var rs = [];
        var array = arr; 
        var count = 1;  
        var yuansu= new Array();//存放数组array的不重复的元素比如{4,5,7,8,2,67,89,}  
        var sum = new Array(); //存放数组array中每个不同元素的出现的次数  
        for (var i = 0; i < array.length; i++) {   
            for(var j=i+1;j<array.length;j++)  
            {  
                if (array[i] == array[j]) {  
                    count++;//用来计算与当前这个元素相同的个数  
                    array.splice(j, 1); //没找到一个相同的元素，就要把它移除掉，  
                    j--;   
                }  
            }  
            yuansu[i] = array[i];//将当前的元素存入到yuansu数组中  
            sum[i] = count;  //并且将有多少个当前这样的元素的个数存入sum数组中  
            count =1;  //再将count重新赋值，进入下一个元素的判断  
        }
        //算出array数组中出现次数最多的两个元素  
        var newsum = new Array(); //  sum;  
        for (var item in sum) {  
            newsum[item] = sum[item];  
        }  
        newsum.sort();
        for (var i = 0; i < sum.length; i++) {  
           if (sum[i] == newsum[newsum.length - 1]) {  
               //document.write("出现次数最多的元素是：" + yuansu[i] + "次数为：" + sum[i] + "<br/>");  
               // first += "出现次数最多的元素是：" + yuansu[i] + "次数为：" + sum[i] + "<br/>";  
               rs.push({"vote":yuansu[i],"count":sum[i]});
           }  
  
       }
       return rs;
    },
    //获取奖励 identity:胜利方角色
    getAward:function (identity) {
        var arr = this.soObjToArr(this.room.socketsArr);
        for(var i=0;i<arr.length;i++){
            var _userGameData = arr[i].handshake.session.userGameData;
            if(!arr[i].unState){
                //如果是平民获胜
                if(identity=="civilians"){
                    //作为平民获胜，并领取奖励
                    _userGameData = (new UC_GameData(arr[i].handshake.session.user)).getAward.call(_userGameData,identity,"winner");
                    (new UC_GameData(arr[i].handshake.session.user)).save.call(_userGameData);
                }else{
                    //作为平民失败，并领取奖励
                    _userGameData = (new UC_GameData(arr[i].handshake.session.user)).getAward.call(_userGameData,identity,"lose");
                    (new UC_GameData(arr[i].handshake.session.user)).save.call(_userGameData);
                }
            }else{
                //如果是卧底获胜
                if(identity=="underCover"){
                    //作为卧底失败，并领取奖励
                    _userGameData = (new UC_GameData(arr[i].handshake.session.user)).getAward.call(_userGameData,"underCover","lose");
                    (new UC_GameData(arr[i].handshake.session.user)).save.call(_userGameData);
                }else{
                    //作为卧底成功，并领取奖励
                    _userGameData = (new UC_GameData(arr[i].handshake.session.user)).getAward.call(_userGameData,"underCover","winner");
                    (new UC_GameData(arr[i].handshake.session.user)).save.call(_userGameData);
                }
            }
        }
    },
    // 进入下一轮
    theNextTurn:function () {
        //重置临时容器，并进入下一轮
        this.socketsArrEnalbed = this.getAllSockets();
        //再次发送关键词，以免玩家忘记自己的关键词
        this.sendWords();
    },
    //游戏结束
    gameover:function () {
        var self = this;
        //将房间和控制器状态改变
        this.State = roomState.Room_Waiting;
        this.room.roomState = roomState.Room_Waiting;
        this.room.saveRoom(function () {
            //将客户端开始按钮变为可用
            self.sendMsg('service order',{order_type:'gameover',order_code:""});
        });
        
    }
}


module.exports = UC_GameController;

