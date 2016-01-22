
/**
 * Created by Tenney on 2016-01-21.
 */


 var config = require('../config'),
    db = config.getDB(),
    KeyWordsDB = db.get('keywords');

var Keywords = function (word1,word2,word3,word4,word5,authorId) {
	this.word1 = word1;		//关键词1
	this.word2 = word2;		//关键词2
	this.word3 = word3;		//关键词3
	this.word4 = word4;		//关键词4
	this.word5 = word5;		//关键词5
	this.createTime = "";			//创建时间
	this.updateTime = "";			//更新时间
	this.authorId = authorId;		//作者ID
	this.auditId;		//审核人ID
	this.auditState;	//审核状态 0:未审核,1:审核通过,10:审核未通过
}


Keywords.getWordsById = function (id,callback) {
	KeyWordsDB.findById(id,function (err,rs_data) {
		if(err){
			console.log("KeyWordsDB-find-err:",err);
			return false;
		}else if(rs_data){
			if(typeof callback == "function"){
				callback(rs_data);
			}
		}
	});
}

Keywords.getWords = function (condition,callback) {
	KeyWordsDB.find(condition,function (err,rs_data) {
		if(err){
			console.log("KeyWordsDB-find-err:",err);
			return false;
		}else if(rs_data){
			if(typeof callback == "function"){
				callback(rs_data);
			}
		}
	});
}

Keywords.addWords = function (obj,callback) {
	KeyWordsDB.insert(obj,{},function (err,rs_data) {
		if(err){
			console.log("KeyWordsDB-insert-err:",err);
			return false;
		}else if(rs_data){
			if(typeof callback == "function"){
				callback(rs_data);
			}
		}
	})
}

Keywords.updateById = function(id,obj,callback) {
	obj.updateTime = (new Date()).toLocaleString();
	KeyWordsDB.updateById(id,obj,{},function (err,rs_data) {
		if(err){
			console.log("KeyWordsDB-update-err:",err);
			return false;
		}else if(rs_data.length>0){
			if(typeof callback == "function"){
				callback(rs_data);
			}
		}
	});
}

Keywords.deleteById = function (id,callback) {
	KeyWordsDB.remove({_id:id},function (err,rs_data) {
		if(err){
			console.log("KeyWordsDB-delete-err:",err);
			return false;
		}else if(rs_data){
			if(typeof callback == "function"){
				callback(rs_data);
			}
		}
	})
}







module.exports = Keywords;