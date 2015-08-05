/**
 * Created by Tenney on 2015-07-21.
 */

var RoomState = {
    Room_Waiting:0,        //房间等待开始状态
    Room_GameStart:5,           //游戏开始，派发关键词
    Room_UserSay:10,         //用户发言状态
    Room_UserVote:20,        //用户投票状态
    Room_GameOver:30         //游戏结束状态
}

module.exports = RoomState;