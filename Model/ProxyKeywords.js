
var Keywords = require('./Keywords');


var ProxyKeywords = function () {
	this.word1;		//关键词1
	this.word2;		//关键词2
	this.word3;		//关键词3
	this.word4;		//关键词4
	this.word5;		//关键词5
	this.createTime;			//创建时间
	this.updateTime;			//更新时间
	this.authorId;		//作者ID
	this.auditId;		//审核人ID
	this.auditState;	//审核状态 0:未审核,1:审核通过,10:审核未通过
}


ProxyKeywords.prototype = {
	getWordsById:function (id,callback) {
		// 这里是验证...

		Keywords.getWordsById(callback);
	},
	getWords:function (condition,callback) {
		//这里是验证

		Keywords.getWords(condition,callback);
	},
	addWords:function(callback) {
		//这里是验证
		this.createTime = (new Date()).getTime();

		Keywords.addWords(this,callback);
	},
	updateById:function (id,obj,callback) {
		// 这里是验证

		Keywords.updateById(id,obj,callback);
	},
	deleteById:function (id,callback) {
		// 这里是验证

		Keywords.deleteById(id,callback);
	}
};



module.exports = ProxyKeywords;

