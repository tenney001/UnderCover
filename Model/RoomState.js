/**
 * Created by Tenney on 2015-07-21.
 */

var RoomState = {
    Room_Waiting:0,        //房间等待开始状态
    Room_UserSay:1,         //用户发言状态
    Room_UserVote:2,        //用户投票状态
    Room_GameOver:3         //游戏结束状态
}

module.exports = RoomState;