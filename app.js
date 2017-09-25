var express = require('express'),
	io = require('socket.io'),
	http = require('http'),
	app = express(),
	bodyParser = require('body-parser');

var marked = require('./src/js/marked.js');

app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.set('views', 'src');
app.engine('html', require('ejs').renderFile);
app.set("view engine", "html");


var server = app.listen(10086,'172.16.6.136',function(){
	var address = server.address();
	console.log('listen to '+address.address+':'+address.port);
});

var ws = io(server);

var chatsTable = [] , roomsTable = [] , usersTable = [];

var checkUserName = function(username){
	for(var k in usersTable){
		if( usersTable[k] &&
			usersTable[k].username == username ){
			return true;
		}else{
			return false;
		}
	}
}
var getUserByToken = function(token){
	return usersTable.filter(function(v){
		return (v.id == token);
	});
}

ws.on('connection',function(socket){

	var room = 1;

	socket.on('register',function(userInfo){

		var user = {
			id : socket.id,
			username : userInfo.username,
			jointime : userInfo.jointime,
			avatar : userInfo.avatar,
			status : '1'
		}

		usersTable.push(user);

		socket.emit('user callback',{type:'register',user:user});

		var notify = {
			type :'notify',
			msg : user.username+' 加入了群聊',
			username: '',
			avatar : '',
			status : '1'
		};

		chatsTable.push(notify);

		socket.join(room);

		ws.to(room).emit('notification',notify);

	});

	socket.on('login',function(token){

		var user = getUserByToken(token);

		if(user[0]){

			usersTable = usersTable.map(function(v){
				if(v.id == token){
					v.id = socket.id;
					v.status = '1';
				}
				return v;
			});

			user[0].id = socket.id;

			socket.join(room);

			socket.emit('user callback',{type:'login',user:user[0]});

		}else{
			socket.emit('user callback',{type:'leave'});
		}
	});

	socket.on('send message',function(data){

		if(chatsTable.length>80) chatsTable.unshift();

		chatsTable.push(data);

		socket.broadcast.to(room).emit('get message',data);

	});

	// socket.on('leave',function(newRoom){
	// 	var username = socket.username;
	// 	socket.leave(room);
	// 	ws.to(room).emit('notification',username+'离开了'+room);
	// 	room = newRoom;
	// 	socket.join(room);
	// 	socket.broadcast.to(room).emit('notification',username+'加入了'+room);
	// });

	// socket.on('send.message',function(msg){
	// 	var pTime = function(i){
	// 		if ( i < 10 ){
	// 			i = "0" +i;
	// 		}
	// 		return i;
	// 	};
	// 	var date = new Date() ,
	// 		time = pTime((date.getMonth()+1))+'-'+pTime(date.getDate())+' '+pTime(date.getHours())+':'+pTime(date.getMinutes())+':'+pTime(date.getSeconds());
	// 	var chat = {username:socket.username,msg:msg,time:time};
	// 	chats.push(chat);
	// 	socket.broadcast.to(room).emit('send.message',chat);
	// });

	socket.on('disconnect',function(){
		usersTable = usersTable.map(function(v){
			if(v.id == socket.id){
				v.status = '0';
			}
			return v;
		});
	});
});

app.get('/',function(req,res){

	var chats = chatsTable.map(function(v){
		if(v.type!=='notify'||v.type==='markdown') v.msg = marked(v.msg);
		return v;
	});

	res.render('index',{title:'华润小黑屋',chats:chats,users:usersTable});
});

app.post('/register',function(req,res){

	var username = req.body.username;

	if(checkUserName(username)){
		res.send('0');
	}else{
		res.send('1');
	}
});

app.post('/change-username',function(req,res){

	var username = req.body.username,
		token = req.body.token;

	usersTable = usersTable.map(function(v){
		if(v.id == token){
			v.username = username;
		}
		return v;
	});

});

// app.get('/zhihu',function(req,res){
// 	http.get('http://news-at.zhihu.com/api/4/news/latest',function(r){
// 	    var data = '';
// 	    r.on('data', function(json) {
// 	        data += json;
// 	    })
// 	    r.on('end', function() {
// 	    	data = JSON.parse(data)
// 			res.render('index',{title:'hello world!',data:data.stories});
// 	    })
// 	});
// });