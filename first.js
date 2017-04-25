/* Hello, World! program in node.js */
console.log("Hello, World!");
var http = require("http");
http.createServer(function (request, response) {
   // Send the HTTP header 
   // HTTP Status: 200 : OK
   // Content Type: text/plain
   response.writeHead(200, {'Content-Type': 'text/plain'});
   
   // Send the response body as "Hello World"
   response.end('Hello World\n');
}).listen(8080);

// Console will print the message
console.log('Server running at http://127.0.0.1:8080/');
console.log("Program 1 Ended\n");



var fs = require("fs"); //file system


//blocking (synchronous)
var data = fs.readFileSync('input.txt');
console.log(data.toString());
console.log("Program 2 Ended\n");



//non-blocking (asynchronous)
fs.readFile('input.txt', function (err, data) {
	if (err) return console.error(err);
	console.log(data.toString());
	console.log("Program 3 Ended NOW");
});
console.log("Program 3 Ended?\n");



var events = require('events'); //import event module
var evemt = new events.EventEmitter(); //new event emitter
var connectHandler = function connected(){
	console.log("Connected WOOOOO!");
	evemt.emit("onconn");
}
evemt.on("myConnectionName", connectHandler);
evemt.on("onconn",function(){
	console.log("The On Connection Function!");
});
evemt.emit("myConnectionName");
console.log("Program 4 Ended\n");



function l1(){
	console.log("This is L1!");
}
function l2(){
	console.log("This is L2!");
}
evemt.addListener("connection",l1);
evemt.on("connection",l2);
function getListeners(){
	var eventListeners = require('events').EventEmitter.listenerCount(evemt,"connection");
	console.log("Number of Listeners connected: "+eventListeners);
}
evemt.emit("connection"); //2 listeners
getListeners();
evemt.removeListener("connection",l2);
getListeners();
evemt.removeAllListeners("connection");
getListeners();
evemt.on("connection",l1);
evemt.on("connection",l2);
getListeners();
console.log("Program 5 Ended\n");




