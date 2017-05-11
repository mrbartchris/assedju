//****setting up the server

 var express = require ("express");
 var app = express();
 var serv = require ("http").Server(app);

 console.log("Ayy lmao");

/*
 app.get('/', function(req, res){
 res.sendFile(__dirname + "/index.html");
 });
 app.use(express.static(__dirname + "/"));
 */

 serv.listen(4000);
 console.log("Server Started!");

//****setting up the server

exports.snl=function(){
    var socketCounter = 0;

//list of sockets
    var SOCKET_LIST = {};
//list of players
    var PLAYER_LIST = {};

//defining what a player is
    function player (id, colour)
    {
        this.id = id;
        this.colour = colour;
    }

    var io = require("socket.io")(serv, {});
    io.sockets.on('connection', function(socket)
    {
        //this will be used to determine whose turn is it to play.
        var turnCount = 0;

        //displaying messages on the console for debugging purposes
        console.log("	Currently there is " + socketCounter + " sockets open.");
        //incrementing the socketCounter when a new scket is connected
        socketCounter++;

        //the id of each socket is set as the number of opened sockets at that time
        socket.id = socketCounter;
        console.log("Socket " + socket.id + " has just been established!");
        console.log("on socket number " + socket.id + " the number of sockets is: " + socketCounter);

        //adding the socket to the arra of sockets
        SOCKET_LIST[socket.id] = socket;


        //when this is received, it means that the player used his turn, so we increment the counter of turns
        socket.on('turnUsed', function()
        {
            console.log("socket.id : " + socket.id + "turnUsed message received. At this point, turnCount = " + turnCount);
            turnCount++;

            //this forces the emitting of 'info' event every time that the turnCount is incremented
            emit();
            console.log("turnCount has just been incremented : " + turnCount);
        });


        for(var i in SOCKET_LIST)
        {
            var socket = SOCKET_LIST[i];

            socket.emit('info', {id: i, turn: turnCount});
        };


        function emit()
        {
            for(var i in SOCKET_LIST)
            {
                var socket = SOCKET_LIST[i];

                socket.emit('info', {id: i, turn: turnCount});
            };
        }


        var colour;

        //the colour of each player is decided on whether he has an even or odd id
        if(socketCounter%2 == 0)
        {
            colour = "FireBrick";
        }else
        {
            colour = "YellowGreen";
        }

        var myPlayer = new player(socket.id, colour);

        console.log("This player has " + colour);


        //this player is then added to the array of players
        PLAYER_LIST[socket.id] = myPlayer;

        //when the 'win' event is received, an event 'won' is sent to every single
        //socket that exits, so as every page is reloaded.
        socket.on('win', function(){
            for(var i in SOCKET_LIST)
            {
                var socket = SOCKET_LIST[i];

                socket.emit('won');
            }
        });



        socket.on('position', function(pos)
        {
            //this 'for loop' loops in the list of all open sockets, and emits to them the position on which
            //the other socket landed.
            for(var i in SOCKET_LIST)
            {
                var socket = SOCKET_LIST[i];

                //sending the position which should be updated to each player
                socket.emit('POS', pos);
                //emitting the colour it should be painted
                socket.emit('colour', colour);

            };
        });



        //upon disconnection of socket, the respective entries are removed from the arrays
        socket.on('disconnect',function()
        {
            socketCounter--;
            delete 	SOCKET_LIST[socket.id] ;
            delete PLAYER_LIST[socket.id];
        });

    });
};