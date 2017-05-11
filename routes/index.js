/**
 * Created by Gabriel on 28/03/2017.
 */
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var socket = require("socket.io");
var fs = require('fs');
const nodemailer = require('nodemailer');

var db = mysql.createConnection({   //define connection parameters
    host: 'sql11.freemysqlhosting.net',     //host
    user: 'sql11169117',                    //username
    password: 'pZm1KdLLrq',                 //password
    port: '3306',                           //port number
    database: 'sql11169117'                 //database name
});
db.connect(function(err) {                  //connect to the database
    if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return;
    }
    console.log('Connected as id ' + db.threadId);
});
/*
var sqlx = "CREATE TABLE users (" +
    "username varchar(32) not null primary key," +
    "password varchar(32) not null, " +
    "email varchar(128) not null, " +
    "verified tinyint(1) default 0," +
    "iconNum int (64) default 0, " +
    "status tinyint(1) default 0" +
    ")default character set utf8 engine = InnoDB";
db.query(sqlx,function(err, rows, fields) {
    if (err) throw err;
    else console.log("Users Table created!");
});
sqlx = "CREATE TABLE friends (" +
    "email varchar(128) not null, " +
    "emailF varchar(128) not null" +
    ")default character set utf8 engine = InnoDB";
db.query(sqlx,function(err, rows, fields) {
    if (err) throw err;
    else console.log("Friends Table created!");
});
*/

var returnRouter = function(io) {

    var users = [];
    var connections = [];
    var currentTimes = [];
    var currUsers = [];

    var icon = null;    //to store variables in case session variables need to be changed
    var uname = null;

    var gameNames=[], gameLinks=[], gameImgs=[];

    function updateStatusTime(){
        var timeNow = new Date().getTime();
        for(var c = 0; c<currentTimes.length; c++){
            if(currentTimes[c].time+600000 < timeNow){    //if 10 mins passed without the socket emitting an update
                //user timeout
                console.log("Signing out "+currentTimes[c].un+" (Reason: Timed out)");
                var sqlto = "update users set status='0' where username='"+currentTimes[c].un+"'";
                db.query(sqlto, function(err){
                    if(err) console.log(err);
                });
                var inum = currUsers.indexOf(currentTimes[c].un);
                currentTimes.splice(inum);
                currUsers.splice(inum);
            }
        }
    }
    setInterval(updateStatusTime, 60000);

    function updateUsernames(){
        io.sockets.emit('get users', users);
    }

    function updateFriends(user, id){
        //the following sql selects the usernames and statuses of the users which are friends with the given user (mutually)

        var sqlf = 'select username, status ' +
            'from users where email in ' +
            '(select a.emailF from friends a, friends b ' +
            'where a.email in ' +
            '(select email from users ' +
            'where username = "'+user+'") ' +
            'and b.email = a.emailF ' +
            'and b.emailF = a.email)';

        db.query(sqlf,function(err,rows){
            if(err) console.log(err);

            if(rows[0]) {   //if results are found (friends!)
                io.sockets.to(id).emit('updateFriends',rows);

            }
            else {  //if no results (i.e. if no friends)
                io.sockets.to(id).emit('updateFriends',0);
            }

        });

    }

    io.sockets.on('connection', function(socket){
        console.log("");
        console.log("New Connection!");
        connections.push(socket);
        console.log('%s sockets connected', connections.length);
        socket.emit('getUN');
        socket.emit('statUp');

        socket.on('disconnect', function(){
            console.log("");
            console.log("Disconnected a socket!");
            users.splice(users.indexOf(socket.username), 1);
            updateUsernames();
            connections.splice(connections.indexOf(socket), 1);
            console.log('%s sockets connected', connections.length);
        });


        socket.on('status update', function(username, time){
            //currentTimes.username =  time;
            if(currUsers.indexOf(username) === -1){     // if user is not in currUsers
                currentTimes.push({un: username, time: time});
                currUsers.push(username);
            }
            else {                                      //search for user in currentTimes
                for(var c = 0; c<currentTimes.length; c++){
                    if(currentTimes[c].un === username){    //if this is the user
                        currentTimes[c].time = time;
                    }
                }
            }
        });

        socket.on('sendUN',function(data){
            socket.username = data;
            users.push(socket.username);
            updateUsernames();
        });

        socket.on('send message', function(data){
            io.sockets.emit('new message', {msg: data, user: socket.username});
        });

        socket.on('addFriend',function(user, cuser){    //user to add, current user
            console.log("");
            console.log(user+" "+cuser);
            var sqlp = "SELECT * FROM users WHERE username='"+user+"'";

            db.query(sqlp,function(err, rows){
                if(err) console.log(err);
                if(rows[0]){
                    var rec = rows[0].email;
                    sqlp = "SELECT * FROM users WHERE username='"+cuser+"'";

                    db.query(sqlp,function(err,rows){
                        if(err) console.log(err);
                        var cuemail = rows[0].email;
                        var frinsert = {
                            email: cuemail,
                            emailF: rec
                        };

                        sqlp = "INSERT INTO friends SET ?";
                        db.query(sqlp,frinsert,function(err){
                            if(err) console.log(err);
                            mail("add",rec,{username: cuser, email: cuemail});
                        });
                    });
                }
            })
        });

        socket.on('invFriend',function(email, cuser){    //email to inv, current user
            console.log("");
            console.log(email+" "+cuser);
            mail("inv",email,{username:cuser});
        });

        socket.on('change avatar',function(user,avatar){
            console.log("Data: "+user+" "+avatar);
            var avIconNum = avatar.split(".");  //splitting from n.png to [n,png]
            icon = avIconNum[0];
            var sqlic = 'UPDATE users SET iconNum="'+icon+'"WHERE username="'+user+'"';
            db.query(sqlic,function(err){
                if(err) console.log(err);
                else console.log(user+"'s icon successfully changed to "+icon+".png");
            });
        });

        socket.on('change password', function(user,oldPass,newPass){    //on receiving change password request
            if(oldPass!==newPass) {
                //first validate password against database
                var sqlpa = 'select * from users where username="' + user + '"';
                db.query(sqlpa, function (err, rows) {
                    if (err) console.log(err);
                    else if (rows[0]) {
                        var goodPass = rows[0].password;    //password from db
                        if (goodPass === oldPass) {           //if passwords match
                            sqlpa = 'UPDATE users SET password="' + newPass + '"WHERE username="' + user + '"';
                            db.query(sqlpa, function (err) {
                                if (err) console.log(err);
                                else {
                                    socket.emit('chpass ok');
                                }
                            });
                        }
                        else {
                            socket.emit('chpass wrong');
                        }
                    }
                });
            }
        });

        socket.on('change username', function(oldUser, newUser){
            console.log(oldUser+" -> "+newUser);
            var sqlus = 'select * from users where username="' + newUser + '"';
            db.query(sqlus,function(err,rows){
                if(err) console.log(err);
                if(!rows[0]){      //if no results are found
                    sqlus = 'UPDATE users SET username="' + newUser + '"WHERE username="' + oldUser + '"';
                    db.query(sqlus, function (err, rows) {
                        if(err) console.log(err);
                        uname = newUser;
                        socket.emit('chuser ok');
                    });
                }
                else {
                    socket.emit('chuser wrong');
                }

            });

        });

        socket.on('tuni l-hbieb', function(user){
            updateFriends(user, socket.id);
        });

        socket.on('friend message', function(msg, thisUser, toUser){
            socket.broadcast.emit('frMsg',msg, thisUser, toUser);
        });
    });

    //importing the games from games.txt
    fs.readFile('./routes/games.txt',function(err,data){
        console.log("-----------------------------------------------------");
        if(err) console.log(err);
        else {
            //console.log(data.toString());
            var txt = data.toString().split("]["); //separates the whole thing into 3 parts, [_____ , _____ , _____]
            txt[0] = txt[0].substring(1, txt[0].length);    //removes [ from the first part
            var len = txt.length-1;
            txt[len] = txt[len].substring(0, txt[len].length - 1);  //removes ] from the last part

            //create arrays for each category from the user supplied sources in the text file
            var ifs = txt[0].split("\r\n");
            var emb = txt[1].split("\r\n");
            var srcs = txt[2].split("\r\n");
            //change to /r/n if local

            //remove empty array elements
            ifs = ifs.filter(function(n){ return n !== ''});
            emb = emb.filter(function(n){ return n !== ''});
            srcs = srcs.filter(function(n){ return n !== ''});
            //now contain [name, attributes]


            var i, arr1=[], arr2=[], arr3=[], arr, arrT=[];
            //counter variable, 3 arrays to hold items, 1 array to hold current set

            //arr will store: link name, game name, img src, attributes
            for(i = 0; i<ifs.length; i++){
                arr = ifs[i].split(" || ");
                arr[0] = arr[0].substring(1, arr[0].length);
                arr[3] = arr[3].substring(0, arr[3].length-1);

                gameLinks.push(arr[0]);
                gameNames.push(arr[1]);
                gameImgs.push(arr[2]);

                arr1[i] = [];
                arrT[0] = arr[0];
                arrT[1] = arr[3];
                arr1[i][0] = arr[0];
                arr1[i][1] = arr[3];
                console.log(arrT);
            }
            console.log(arr1);
            for(i = 0; i<emb.length; i++){
                arr = emb[i].split(" || ");
                arr[0] = arr[0].substring(1, arr[0].length);
                arr[3] = arr[3].substring(0, arr[3].length-1);

                gameLinks.push(arr[0]);
                gameNames.push(arr[1]);
                gameImgs.push(arr[2]);

                arr2[i] = [];
                arrT[0] = arr[0];
                arrT[1] = arr[3];
                arr2[i][0] = arr[0];
                arr2[i][1] = arr[3];
                console.log(arrT);
            }
            console.log(arr2);
            for(i = 0; i<srcs.length; i++){
                arr = srcs[i].split(" || ");
                arr[0] = arr[0].substring(1, arr[0].length);
                arr[3] = arr[3].substring(0, arr[3].length - 1);

                gameLinks.push(arr[0]);
                gameNames.push(arr[1]);
                gameImgs.push(arr[2]);

                arr3[i] = [];
                arrT[0] = arr[0];
                arrT[1] = arr[3];
                arr3[i][0] = arr[0];
                arr3[i][1] = arr[3];
                console.log(arrT);
            }
            console.log(arr3);

            //now adding routes for each name/attribute set -> should also add img in layout.pug
            console.log("_______________Iframes_______________");
            for(i = 0; i<arr1.length; i++){
                (function(i) {
                    var gname = arr1[i][0];
                    var attrs = arr1[i][1];
                    console.log("Game name: " + gname);
                    console.log("Game Atrrs: " + attrs);
                    router.get("/game/" + gname, function (req, res) {
                        var username = req.session.username;
                        var icon = req.session.icon;
                        res.render('gameLays', {
                            username: username,
                            icon: icon,
                            atts: "iframe " + attrs
                        });
                    });
                })(i);
            }
            console.log("_______________Embeds_______________");
            for(i = 0; i<arr2.length; i++){
                (function(i) {
                    var gname = arr2[i][0];
                    var attrs = arr2[i][1];
                    console.log("Game name: " + gname);
                    console.log("Game Atrrs: " + attrs);
                    router.get("/game/" + gname, function (req, res) {
                        var username = req.session.username;
                        var icon = req.session.icon;
                        res.render('gameLays', {
                            username: username,
                            icon: icon,
                            atts: "embed " + attrs
                        });
                    });
                })(i);
            }
            console.log("_______________Sources_______________");
            for(i = 0; i<arr3.length; i++){
                (function(i) {
                    var gname = arr3[i][0];
                    var attrs = arr3[i][1];
                    console.log("Game name: " + gname);
                    console.log("Game Atrrs: " + attrs);
                    router.get("/game/" + gname, function (req, res) {
                        var username = req.session.username;
                        var icon = req.session.icon;
                        res.render('gameLays', {
                            username: username,
                            icon: icon,
                            atts: "script " + attrs
                        });
                    });
                })(i);
            }

        }
        console.log("-----------------------------------------------------");
    });







    router.use(function timeLog(req, res, next) {    //function to log time of each request
        console.log("");
        //var dx = new Date();
        //var d = dx.getHours() + ":" + dx.getMinutes() + ":" + dx.getSeconds();
        //console.log("Time: "+d);
        //console.log("Username cookie: "+req.cookies.oreo);
        //console.log("Password cookie: "+req.cookies.pb);
        if(icon!==null) {
            req.session.icon = icon;
            icon = null;
        }
        if(uname!==null){
            req.session.username = uname;
            res.cookie('tempUN', uname);
            uname = null;
        }
        next();
    });

    router.all('/', function (req, res) {       //index
        console.log("Index Get http://" + req.hostname);
        //var scriptX = require('C:/Users/Gabriel/Desktop/nodeTesting/script.js');
        //res.sendFile(__dirname + "/" + "index.html");
        if (req.cookies.oreo && req.cookies.pb) {
            var username = req.cookies.oreo;
            var icon = req.cookies.icon;
            var sql="update users set status='1' where username='"+username+"'";
            db.query(sql, function(err){if(err) console.log(err)});
            req.session.username = username;
            req.session.icon = icon;
            res.render('layout', {username: username, icon: icon, gn:gameNames, gl:gameLinks, im:gameImgs});
        }
        else if (req.session.username) {
            var usernam = req.session.username;
            res.render('layout', {username: usernam, icon: req.session.icon, gn:gameNames, gl:gameLinks, im:gameImgs});
        }
        else {
            res.render('logregLay');
        }
    });

    router.get('/about',function(req,res){
        console.log("About Get");
        res.render('about',{username: req.session.username, icon: req.session.icon});
    });

    router.all('/dummy',function(req,res){
       res.end("Dummy Page!");
    });

    router.get("/loginRedir", function (req, res) {
        console.log("Get request received for login!");
        if (req.session.username) {
            var username = req.session.username;
            var icon = req.session.icon;
            res.render('layout', {username: username, icon: icon, gn:gameNames, gl:gameLinks, im:gameImgs});
        }
        else {
            res.redirect("/");
        }
    });

    router.post("/loginRedir", function (req, res) {       //login redirect to handle post info
        console.log("Post request received for login!");
        var username = req.body.usernamel;
        var password = req.body.passwordl;
        var sql = "SELECT * FROM users WHERE username='" + username + "'";
        db.query(sql, function (err, rows, fields) {
            if (err) throw err;
            if (rows[0]) { //if a user is found
                //console.log(rows[0]);                             //Row Data Packet
                //console.log("Password is: "+rows[0].password);    //Row Data - password

                if (rows[0].password === password) { //if password input matches password in db
                    var icon = rows[0].iconNum;
                    if (req.body.chkbx) { //if remember me checkbox is returned (i.e. is checked)
                        res.cookie('oreo', username);
                        res.cookie('pb', password);
                        res.cookie('icon', icon);
                        console.log("Logging in: Remember me CHECKED!");
                    }
                    else {
                        console.log("Logging in: Remember me not checked");
                    }
                    sql="update users set status='1' where username='"+username+"'";
                    db.query(sql, function(err){if(err) console.log(err)});

                    req.session.icon = icon;
                    req.session.username = username;
                    res.cookie('tempUN', username);
                    console.log("Icon: "+icon);
                    res.render('layout', {username: username, icon: icon, gn:gameNames, gl:gameLinks, im:gameImgs});
                }
                else {
                    res.render('logregLay', {error: "Incorrect password"});
                }
            }
            else {
                console.log("No Results!");
                res.render('logregLay', {error: "No user with that username was found!"});
            }
        });
    });

    router.get('/confirmEmail/:email', function (req, res) {
        var email = req.params.email;
        var sql = 'UPDATE users SET verified=1 where email="' + email + '"';
        db.query(sql, function (err, rows) {       //set verified to 1
            res.redirect("/");
            console.log("Confirmed " + email);
        });
    });

    router.get("/sORed", function (req, res) {          //sign out redirect
        var sql = "update users set status='0' where username='"+req.session.username+"'";
        db.query(sql, function(err){if(err) console.log(err)});
        req.session.destroy();
        res.clearCookie('oreo');
        res.clearCookie('pb');
        res.clearCookie('tempUN');
        res.redirect("/");
    });

    router.post("/registerRedir", function (req, res) {
        console.log("Post request received for register!");
        var username = req.body.username;
        var email = req.body.email;
        var password = req.body.password;
        var sql = "SELECT COUNT(*) AS count FROM users WHERE username='" + username + "'";
        db.query(sql, function (err, rows) {  //check if username already exists
            var rowNum = rows[0].count;
            if (rowNum === 0) {             //if no existing username found
                sql = "SELECT COUNT(*) AS count FROM users WHERE email='" + email + "'";
                db.query(sql, function (err, rows) {  //check if email already exists
                    rowNum = rows[0].count;
                    if (rowNum === 0) {       //if no existing email found
                        var regins = {
                            username: username,
                            password: password,
                            email: email
                        };
                        sql = 'INSERT INTO users SET ?';
                        db.query(sql, regins, function (err, rows) {       //insert data into table
                            mail("conf", email, {});
                            res.render('logregLay', {successMsg: "Check your email to confirm registration!"});
                        });
                    }
                    else {                  //if an existing email is found
                        res.render('logregLay', {error: "Email already in use!"});
                    }
                });
            }
            else {                          //if an existing username is found
                res.render('logregLay', {error: "Username already in use!"});
                console.log("This happened!");
            }
        });
    });

    router.get("/registerRedir", function (req, res) {
        res.redirect("/");
    });

    router.get("/addFriend/:email/:emailF",function(req,res){
        //http://www.assedju.com/addFriend/emailfriend/emailuser
        var email = req.params.email;
        var emailF = req.params.emailF;
        var frinsert = {
            email: email,
            emailF: emailF
        };

        var sql = "INSERT INTO friends SET ?";
        db.query(sql,frinsert,function(err,rows){
            if(err) console.log(err);
            else console.log(email+" added "+emailF+" back as friend!");
        });
        res.end("Friend added!");
    });

    router.get("/actSettings/avat", function(req,res){
        if(req.session.username) {
            var icon = req.session.icon;
            var username = req.session.username;
            res.render('layoutActSet', {avat: true, username: username, icon: icon});
        }
        else {
            res.redirect('/');
        }
    });

    router.get("/actSettings/user", function(req,res){
        if(req.session.username) {
            var icon = req.session.icon;
            var username = req.session.username;
            res.render('layoutActSet', {user: true, username: username, icon: icon});
        }
        else {
            res.redirect('/');
        }
    });

    /*
    router.get("/game/freeciv", function(req,res){
        var username = req.session.username;
        var icon = req.session.icon;
        res.render('gameLay', {username: username, icon: icon, game:"freeciv"});
    });

    router.get("/game/snake", function(req,res){
        var username = req.session.username;
        var icon = req.session.icon;
        res.render('gameLay', {username: username, icon: icon, game:"snake"});
    });

    router.get("/game/fboywgirl", function(req,res){
        var username = req.session.username;
        var icon = req.session.icon;
        res.render('gameLay', {username: username, icon: icon, game:"fbwg"});
    });
    */


    router.get("/actSettings/pass", function(req,res){
        if(req.session.username) {
            var icon = req.session.icon;
            var username = req.session.username;
            res.render('layoutActSet', {pass: true, username: username, icon: icon});
        }
        else {
            res.redirect('/');
        }
    });

    return router;
};

function mail(type, rec, adds){   //type is conf,add, inv, invG, adds for additional parameters
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'minikrisp@gmail.com',
            pass: 'pa$$word98'
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // setup email data with unicode symbols
    var mailOptions = {
        from: '"Kaspy @ Minikrisp" <minikrisp@gmail.com>', // sender address
        to: rec, // list of receivers
        subject: 'Confirm Your Account', // Subject line
        text: 'Press the following link to confirm your account: http://www.assedju.com/confirmEmail/'+rec, // plain text body
        //disableUrlAccess: false,
        html: '<b>Press the following link to confirm your account: </b>' +
        '<a href="http://www.assedju.com/confirmEmail/'+rec+'">Verify your account</a>' // html body
    };

    if (type==="add"){
        mailOptions.subject = 'New Friend Request';
        mailOptions.text = adds.username+' sent you a friend request! Press this link to add '+adds.username+'to your friends list!'
            +'http://www.assedju.com/addFriend/'+rec+'/'+adds.email;
        mailOptions.html =  '<b>'+adds.username+' sent you a friend request!</b><BR>' +
            'Click <a href="http://www.assedju.com/addFriend/'+rec+'/'+adds.email+'"> here </a>' +
            ' to add '+adds.username+' to your friends list!';
    }
    else if (type==="inv"){
        mailOptions.subject = 'MiniKrisp Invite';
        mailOptions.text =  adds.username+' invited you to join MiniKrisp! ' +
            'Click here to join: http://www.assedju.com/';
        mailOptions.html =  '<b>'+adds.username+' invited you to join MiniKrisp!</b><BR>' +
            'Click <a href="http://www.assedju.com">here </a> to join!';
    }
    else if (type==="invG"){
        mailOptions.subject = 'MiniKrisp Game Invite';
        mailOptions.text =  adds.username+' invited you to a game of '+adds.game+'! ' +
            'Click here to join: http://www.assedju.com/invg/'+adds.game+'/'+adds.username+'/'+rec;
        mailOptions.html =  '<b>'+adds.username+' invited you to a game of '+adds.game+' on MiniKrisp!</b><BR>' +
            'Click <a href="http://www.assedju.com/invg/'+adds.game+'/'+adds.username+'/'+rec+'">here </a> to join!';
    }

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (err, info){
        if (err) {
            return console.log("Error: "+err);
        }
        else {
            console.log('Message %s sent: %s', info.messageId, info.response);
        }
    });

}


module.exports = returnRouter;

/* A list of Session Variables and Cookies
* session: .username .icon .status
* cookies: tempUN, oreo/pb if remember
* */