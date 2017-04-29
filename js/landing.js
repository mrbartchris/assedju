var socket = io();

$(document).ready(function(){
    $('[data-toggle="popover"]').popover();
    socket.emit('tuni l-hbieb', getCookie("tempUN"));

});

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

$('#addFriendForm').on('submit', function (e) {
    e.preventDefault();
    var user = document.getElementById("usern").value;
    var emun = getCookie("tempUN");
    socket.emit('addFriend',user, emun);
    $('#addFriendModal').modal('hide');
    $('#usern').val('');
});

$('#invFriendForm').on('submit', function (e) {
    e.preventDefault();
    var eminv = document.getElementById("emailInv").value;
    var emun = getCookie("tempUN");
    socket.emit('invFriend',eminv, emun);
    $('#invFriendModal').modal('hide');
    $('#emailInv').val('');
});

socket.on('getUN',function(){
    var username = getCookie("tempUN");
    socket.emit('sendUN',username);
});

socket.on('new message', function(data){
    $('#chat').append('<div class="well lessPadding"><strong>' +data.user+ '</strong>: ' +data.msg+ '</div>');
});



$('#messageForm').submit(function(e){
    e.preventDefault();
    if($('#message').val() !== '') {
        socket.emit('send message', $('#message').val());
        $('#message').val('');
    }
});

function unique(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
        var item = a[i];
        if(seen[item] !== 1) {
            seen[item] = 1;
            out[j++] = item;
        }
    }
    return out;
}

socket.on('get users', function(datax){
    var html = '';
    var data = unique(datax);   //gets the user list and only shows one copy of each username
    //if multiple tabs open for one user, that username is sent repeatedly, so unique() prevents this scenario
    for(var i = 0; i < data.length; i++){
        html  += '<li class = "list-group-item lessPadding">' +data[i]+ '</li>';
    }
    $('#users').html(html);
});

socket.on('updateFriends', function(data){
    var fl = document.getElementById("friendsList");
    if(data===0){   //if no friends
        fl.innerHTML = "Add some friends above!";
    }
    else {          //if friends
        fl.innerHTML = "";

        for(var i = 0; i<data.length; i++){
            var html;

            if(data[i].status === 0 && i === data.length-1){        //if offline and last friend
                html = '<a class="friendstc unBord" href="#">'+data[i].username+'<img class="frstatus" src="imgs/offline.png"></a>';
                fl.innerHTML += html;
            }
            else if (data[i].status === 0){                         //if offline and not last friend
                html = '<a class="friendstc" href="#">'+data[i].username+'<img class="frstatus" src="imgs/offline.png"></a>';
                fl.innerHTML += html;
            }
            else if (data[i].status === 1 && i === data.length-1){  //if online and last friend
                html = '<a class="friendstc unBord" onclick="openChat(\''+data[i].username+'\')">'+data[i].username+'<img class="frstatus" src="imgs/online.png"></a>';
                fl.innerHTML += html;

            }
            else if (data[i].status === 1){                         //if online and not last friend
                html = '<a class="friendstc" onclick="openChat(\''+data[i].username+'\')">'+data[i].username+'<img class="frstatus" src="imgs/online.png"></a>';
                fl.innerHTML += html;
            }
        }

    }
});

var numChats = 0;

function openChat(username){
    if(numChats<4) {            //if no more than 4 chats are open
        if (document.getElementById("chat" + username)) {   //if chat already exists
            if(document.getElementById("chat" + username).classList.contains("hidden")) {  //if chat is not hidden
                numChats++;
            }
            document.getElementById("chat" + username).classList.remove("hidden");
            document.getElementById("friendCW" + username).classList.add("open");
        }
        else {      //if chat doesn't exist
            numChats++;
            var inHTML =
                '<div class="col-xs-3 col-sm-3 col-md-3 col-lg-3" id="chat' + username + '">' +
                    '<div class="dropup friendsPos open" id="friendCW' + username + '">' +
                        '<div class="dropdown-menu friendsChatWindow">' +
                            '<div class="friendsChatTitle">' +
                            username +
                            '<button type="button" class="close" onclick="hideChat(this)">×</button> </div> ' +
                        '<div class="friendsChatMessage">' +
                            //'<div> <p class="well myWell truncateOF">Sample Message Received</p></div> ' +
                            //'<div> <p class="well myWell myMsg truncateOF">My MessageAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA</p></div>' +
                        '</div> ' +
                        '<div class="friendsChatMessageArea"> ' +
                            '<form name="friendMsgForm" onsubmit="submitFunc(this); return false;"> ' +
                                '<div class="form-group noMargin"> ' +
                                    '<input type="text" class="form-control friendsChatInput" placeholder="Type a message..."> ' +
                                '</div> ' +
                            '</form> ' +
                '</div></div></div></div>';

            document.getElementById("friendsChatsRow").innerHTML += inHTML;
        }
    }
}

function hideChat(x){
    x.parentElement.parentElement.parentElement.classList.remove("open");
    x.parentElement.parentElement.parentElement.parentElement.classList.add("hidden");
    numChats--;
}


function showAllFChats(){
    var x = new Date();
    openChat(x.getTime());
}

function submitFunc (e) {   //passing the form to the function
    var message = e.children[0].children[0].value;  //getting the msg from the form
    message = message.trim();
    if(message !== '') {
        e.reset();                                      //resetting the form
        var elemID = e.parentElement.parentElement.parentElement.id;        //getting the element with id containing the username
        var toUser = elemID.split('friendCW').slice(1).join('friendCW');     //in case some user has friendCW in their username

        var welem = e.parentElement.parentElement.children[1];

        var html = '<div> <p class="well myWell myMsg truncateOF">'+message+'</p></div>';
        welem.innerHTML+=html;

        var thisUser = getCookie('tempUN');
        //alert(thisUser + " > " + toUser + " :: " + message);
        socket.emit('friend message', message, thisUser, toUser);
    }
}

socket.on('frMsg',function(msg, thisUser, toUser){
    if(toUser === getCookie('tempUN')){     //if this is the intended user
        openChat(thisUser);                 //opens chat with the user sending the msg

        var chat = document.getElementById("chat"+thisUser).children[0].children[0].children[1];

        var html = '<div> <p class="well myWell truncateOF">'+msg+'</p></div>';
        chat.innerHTML+=html;
    }
});

socket.on('statUp', function(){
    var username = getCookie("tempUN");     //username
    var d = new Date().getTime();           //time
    socket.emit('status update', username, d);
    setInterval(function() {
        var d = new Date().getTime();       //time
        socket.emit('status update', username, d);
        },600000);                              //10 minutes = 600 seconds = 600,000 ms
});

/*
$("form[name='friendMsgForm']").submit(function(e){
    e.preventDefault();
    alert("This happened");

    var message = this.children[0].children[0].val();
    alert("Submitted: "+message);
    socket.emit('friend message', message);
    //reset message .val('')
});
*/

