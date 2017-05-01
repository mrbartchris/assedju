var express = require("express");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require ('path');
var expressSession = require('express-session');
const nodemailer = require('nodemailer');

var app = express();
var server = app.listen(process.env.PORT || 8080, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log("Starting app at http://%s:%s",host,port);
});
var io = require('socket.io').listen(server);
var routes = require('./routes/index')(io);

//set view engine
app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'pug');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(expressSession({secret: 'kaspy', saveUninitialized: false, resave:false}));
app.use(cookieParser());
app.use(express.static(__dirname + '/'));

app.use('/',routes);

app.use(function(req,res,next){
    var err = new Error('Ma nistax insib il-pagna siehbi');
    err.status = 404;
    res.redirect("/");
    next(err);
});

app.io = io;

/*
app.use(function(req,res,next){
    req.io = io;
    next();
});
*/


module.exports = app;

