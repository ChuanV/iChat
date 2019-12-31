var ws = require('nodejs-websocket')
var User = require('./models/user')
var server = ws.createServer(function(conn) {
	console.log('New connection ...')
	conn.on('text', function(str) {
		var data = JSON.parse(str)
		// console.log(data);
		// if (data.message) {
		// 	data.message = fjs(data.message)
        // }
		switch (data.type) {
			case 'setname':
				conn.nickname = data.name;
				boardcast(JSON.stringify({
					type: 'serverInformation',
					message: data.name + '加入房间'
				}))
				getAllUser()
				break;
			case 'chat':
				boardcast(JSON.stringify({
					type: 'chat',
					name: conn.nickname,
					message: data.message,
					pic: data.pic,
					toUser:data.toUser
				}))
				break;
			case 'chatTo':
					siBoardcast(data,JSON.stringify({
						type: 'chat',
						name: conn.nickname,
						message: data.message,
						pic: data.pic,
						toUser:data.toUser
					}))
					break;
			case 'call':
					siBoardcast(data,JSON.stringify({
						type: 'call',
						name: conn.nickname,
						message: data.message,
						pic: data.pic,
						toUser:data.toUser
					}),true)
					break;
		}
	})
	conn.on('close', function() {
		boardcast(JSON.stringify({
			type: 'serverInformation',
			message: conn.nickname + '离开房间'
		}))
		getAllUser()
	})
	conn.on('error', function(errObj,reason) {
		console.log('异常关闭')
	})
})

//聊天信息广播
function boardcast(msg) {
	server.connections.forEach(function(conn) {
		conn.sendText(msg)
	})
}
//私播
function siBoardcast(data,msg,isCall) {
	if(isCall){
		server.connections.forEach(function(conn) {
			//呼叫
			if(data.toUser == conn.nickname){
				conn.sendText(msg)
			}
		})
		return;
	}	
	server.connections.forEach(function(conn) {
		//私聊时，对双方都发送消息
		if(data.toUser == conn.nickname || conn.nickname == data.name){
			conn.sendText(msg)
		}
	})
}
//广播所有用户
function getAllUser() {
	var chatterArr = [];//在线用户
	var offUser = []; //下线用户
    server.connections.forEach(function(conn) {
		chatterArr.push(conn.nickname);
	})
	//获取离线用户 
	async function getOffUser(){
		var result = await User.find({},function(err,data){
			if(err){
				console.log(err.message);
			}
		})
		result.forEach(function(item){
			var temp = item.username
			if(chatterArr.indexOf(temp) === -1){
				offUser.push(item.username)
			}
		})
		return offUser
	}
	getOffUser().then(res=>{
		server.connections.forEach(function(conn) {
			conn.sendText(JSON.stringify({
				type: 'chatterList',
				list: JSON.stringify({chatterArr,offUser})
			}))
		})
	})
}

function fjs(t) {
	t.replace(/script/g, '...')
	t = t.replace(/({|})/g, '')
	t = t.replace(/</g, '&lt;')
	t = t.replace(/>/g, '&gt;')
	t = t.replace(/<\/?[^>]*>/g, '')
	return t
}

module.exports = server