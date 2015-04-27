$(function (){
    //Message Data Model
    function Message(nick,message){
      var self = this;
          self.nick = nick;
          self.message = message;
    };
    //User Data Model
    function User(id,nick)
    {
        var self = this;
            self.id = id;
            self.nick = nick;
    }

    //View Model
    function ChatMainViewModal()
    {
        var self = this;
        //Observable information
        self.messages = ko.observableArray([]); //all public messages
        self.sendingmessage = ko.observable(""); //public printing message
        self.privateMessages = [[new User("testId","admin"),[new Message("testNick","Message1"),new Message("testNick","Message2"),new Message("testNick","Message3")]],[new User("testId2","user"),[new Message("testNick","UserMessage1"),new Message("testNick","UserMessage2")]]]; // all private message. [User][All private message with him]
        self.hasFocus = ko.observable(true);
        self.userList = ko.observableArray([]);
        //Ye,this maybe not so good,but...
        self.name = $("b#nickName").text();
        //=== For private messages
            //Observable information
            self.activePrivateUser = ko.observable(new User("",""));
            self.activePrivateMessages = ko.observableArray([]);
            self.sendingPrivateMessages = ko.observable("");//private printing message
            self.hasPrivateFocus = ko.observable(false);

            //Behavior
            self.sendPrivateMessage = function()
            {
                var text = self.sendingPrivateMessages();
                if (text.length <= 0)
                    return;
                //self.activePrivateMessages.push(new Message(self.name,text));
                //Save post message in common storage
                addPrivateMessageInCommonStorage({message:text,nick:self.name,idAuthor:self.activePrivateUser().id});
                //Clear sendingPrivateMessage
                self.sendingPrivateMessages("");
                //TODO. Post to server destination socket,message
                socket.emit("privateMessage", {message:new Message(self.name,text),destination:self.activePrivateUser().id,idAuthor:(socket.id).toString()});
            }
        //=== end - "For private messages"

        //Behavior
        //1. Click "Send message"
        self.sendMessage = function(){
            var text = self.sendingmessage();
            if (text.length <= 0)
                return;
            //Clear sendingMessage
            self.sendingmessage("");
            socket.emit("message", {message: text, name: self.name});
        };
        //2.Send system message
        self.msg_system = function (message) {
            self.messages.push(new Message(null,safe(message)));
        }
        //3. Send user message
        self.msg = function(nick, message) {
            self.messages.push(new Message(safe(nick), safe(message)));
        };
        //4. Click for user nick on user list. Change active private user, display prev messages
        self.openPrivateWindow = function(userNick){
            //a.Change active user, with whom we communicate
            self.activePrivateUser(userNick);
            self.activePrivateMessages.removeAll();
            self.hasPrivateFocus(true);
            //b.Get all prev messages
            for(var i=0;i < self.privateMessages.length;i++)
            {
                if (self.privateMessages[i][0].id === userNick.id)
                {
                    //display all messages
                    ko.utils.arrayPushAll(self.activePrivateMessages,self.privateMessages[i][1]);
                    self.activePrivateMessages.valueHasMutated();
                    return;
                }
            }
        };
    } // end viewModel

    //Help method and events
    function safe(str) {
        return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function addPrivateMessageInCommonStorage(data)
    {
        var foundUser = false;
        for(var i=0;i < viewModel.privateMessages.length;i++)
        {
            if (viewModel.privateMessages[i][0].id === data.idAuthor)
            {
                foundUser = true;
                //add new message to common massive
                viewModel.privateMessages[i][1].push(new Message(data.nick,data.message));
                //Check, if it for activeUser or not
                if (data.idAuthor === viewModel.activePrivateUser().id)
                    viewModel.activePrivateMessages.push(new Message(data.nick,data.message));

                return;
            }
        }
        //If we not found user - we add it like new
        if (!foundUser)
        {
            viewModel.privateMessages.push([new User(data.idAuthor,data.nick),[new Message(data.nick,data.message)]]);
            if (data.idAuthor === viewModel.activePrivateUser().id)
                viewModel.activePrivateMessages.push(new Message(data.nick,data.message));
        }

        return;
    }

    var viewModel = new ChatMainViewModal();
    ko.applyBindings(viewModel);

    //Create socket
    var socket = io.connect('http://localhost:3000');
    //Events
    socket.on('connecting', function () {
        viewModel.msg_system('Connecting...');
    });
    socket.on('connect', function () {
        viewModel.msg_system('Connect successful!');
        //After successful connect - add user name to user list
        //Emit event that new user add to chat room.
        var socketId = (socket.id).toString();
        socket.emit('addNewUser',{id:socketId,nick:viewModel.name});
        //And add yourself to user list
        viewModel.userList.push(new User(socketId,viewModel.name));
    });
    socket.on('showUsersInRoom',function(listOfUser) {
        if (listOfUser.length != 0)
        {
            ko.utils.arrayForEach(listOfUser,function(item) {
                viewModel.userList.push(new User(item.id,item.nick));
            });
        }
    });
    socket.on('addNewUser',function(data)
    {
        //When we get event - add new User in user list
        viewModel.userList.push(new User(data.id,data.nick));
        //And send system message
        var date = new Date();
        viewModel.msg_system('User "'+data.nick+'" with us! '+ date.toTimeString());
    });
    socket.on('message', function (data) {
        viewModel.msg(data.name, data.message);
        viewModel.hasFocus(true);
    });
    socket.on('userDisconnected',function(data)
    {
        //1. Find disconnected user and delete it from user list
        for(var i=0;i<viewModel.userList().length;i++)
        {
            if(viewModel.userList()[i].id == data.id)
            {
                //2.Delete from listOfuser
                viewModel.userList().splice(i,1);
                viewModel.userList.valueHasMutated();
            }
        }
        //2. Write system message
        var dateDisc = new Date();
        viewModel.msg_system("User '"+data.nick+"' was disconnected!"+dateDisc.toTimeString());
    });
    socket.on("incomingPrivateMessage",function(data)
    {
        addPrivateMessageInCommonStorage(data);
    });
});
