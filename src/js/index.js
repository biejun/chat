~(function($,w){

	var Chat = function(){
		marked.setOptions({
			highlight: function (code) {
				return hljs.highlightAuto(code).value;
			}
		});
	};

	Chat.prototype = {

		getValue : function(k){

			return w.localStorage.getItem(k);
		},
		setValue : function(k,v){

			w.localStorage.setItem(k,v);
		},
		init:function(res){

			var self = this; ws = self.ws;

			var token = (res.user && res.user.id) ? res.user.id : '';

			if(res.type == 'register' || res.type == 'login'){

				self.username = res.user.username;

				self.avatar = res.user.avatar;

				self.getMessage();

				self.sendMessage();

				self.notification();
			}
			if(res.type == 'leave'){

				self.$chat.hide();

				self.register();
			}

			self.setValue('token',token);

		},
		getMessage:function(){

			var self = this;

			self.ws.on('get message', function(data){

				$('#message>.message').append(self.messageTpl(data));

				$('#message').scrollTop($('#message')[0].scrollHeight);

			});
		},
		sendMessage:function(){

			var self = this , $send = $('#chat-btn') , $msg = $('.chat-input') , msg = '';

			var message = function(msg,type){

				var data = {
					type : type,
					username : self.username,
					msg : msg,
					time : self.formatTime()
				};

				ws.emit('send message',data);

				$('#message>.message').append(self.messageTpl(data,true));

				$('#message').scrollTop($('#message')[0].scrollHeight);

			}

			$msg.on('keyup',function(event){

				var $this = $(this);

				if(event && event.which !== 13){

					msg = $.trim($this.html().replace(/&nbsp;/g,''));

					if(msg.length>=1){

						$send.prop('disabled',false);

					}else{

						$send.prop('disabled',true);
					}
				}

				if(event && event.which == 13){

					if(msg!='') message(msg,'msg');

					$send.prop('disabled',true);

					$msg.html('');

					msg = '';
				}
			});

			$send.on('click',function(){

				message(msg,'msg');

				$send.prop('disabled',true);

				msg = '';

				$msg.html('');
			});

			$('#submitMsg').click(function(){

				var msg = $('#markdown').val();

				message(msg,'markdown');

				$('#mask').hide();

				$('#markdown').val('');
			});
		},
		notification:function(){

			this.ws.on('notification',function(data){

				$('#message>.message').append('<p class="notify"><span>'+data.msg+'</span></p>');

			});
		},
		messageTpl:function(chat,isSelf){

			var msg = (chat.type === 'msg') ? chat.msg : marked(chat.msg);

			return '<div class="message-box'+((isSelf)?' my':'')+'">'+

							'<div class="message-info">'+

								'<a class="username">'+chat.username+'</a> '+

								'<span class="time">'+chat.time+'</span>'+

							'</div>'+

							'<div class="message-text">'+

								msg+

							'</div>'+
					'</div>';
		},
		formatTime:function(){

			var pTime = function(i){

				if ( i < 10 ){

					i = "0" +i;
				}
				return i;
			};

			var date = new Date(),

				month = date.getMonth()+1,

				days = date.getDate(),

				hours = date.getHours(),

				mins = date.getMinutes(),

				secs = date.getSeconds();

			return pTime(month)+'-'+pTime(days)+' '+pTime(hours)+':'+pTime(mins)+':'+pTime(secs);
		}
	}

	var User = function(ws){

		this.ws = ws;

		this.username = '';

		this.avatar = '';

		this.token = this.getValue('token');

		this.$join = $('#join');

		this.$chat = $('#chat');

		(this.token) ? this.login() : this.register();

		this.ws.on('user callback',this.init.bind(this));

	};

	User.prototype = new Chat();

	User.constructor = User;

	User.prototype.register = function(){

		var self = this , $join = self.$join , $chat = self.$chat;

		var $input = $('#username') , $joinInput = $('.join-input');

		$join.css('display','table');

		$input.focus();

		$input.on('keydown',function(event){

			var $this = $(this);

			$joinInput.removeClass('error');

			if(event && event.which == 13){

				var username = $.trim($this.val());

				if(username!==''){

					$.post('/register',{username:username},function(res){

						if(res === '1'){

							$join.fadeOut(300);

							$chat.css('display','table').find('.chat-box').addClass('pop');

							$('#chat-input').focus();

							self.ws.emit('register',{username:username,jointime:new Date().getTime(),avatar:''});
						}else{

							$joinInput.addClass('error');
						}

					});
				}
			}
		});
	};
	User.prototype.login = function(){

		var self = this , $join = self.$join , $chat = self.$chat;

		this.ws.emit('login',this.token);

		$chat.css('display','table').find('.chat-box').addClass('pop');

		$('#chat-input').focus();
	}

	var ws = io();

	new User(ws);

})(jQuery,window);