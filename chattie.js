var http = require("http");
var url = require("url");
var fs = require("fs");
var path = require("path");
var socketio = require("socket.io");
var mimeTypes = { "html": "text/html", "jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png", "js": "text/javascript", "css": "text/css", "swf": "application/x-shockwave-flash"};

var httpServer = http.createServer(
	function(request, response) {
		var uri = url.parse(request.url).pathname;
		if (uri=="/") uri = "/client/index.html";
		var pre=uri.split("/");
		if(pre[0]!="" || (pre[1]!="client" && pre[1]!="favicon.ico")){
				response.writeHead(200, {"Content-Type": "text/plain"});
				response.write('404 Not Found\n');
				response.end();
		}
		var fname = path.join(process.cwd(), uri);
		fs.exists(fname, function(exists) {
			if (exists) {
				fs.readFile(fname, function(err, data){
					if (!err) {
						var extension = path.extname(fname).split(".")[1];
						var mimeType = mimeTypes[extension];
						response.writeHead(200, mimeType);
						response.write(data);
						response.end();
					}
					else {
						response.writeHead(200, {"Content-Type": "text/plain"});
						response.write('Error de lectura en el fichero: '+uri);
						response.end();
					}
				});
			}
			else{
				//console.log("Peticion invalida: "+uri);
				response.writeHead(200, {"Content-Type": "text/plain"});
				response.write('404 Not Found\n');
				response.end();
			}
		});
	}
);

httpServer.listen(8080);
var io = socketio.listen(httpServer);

var allClients = new Array();

io.sockets.on('connection',function(client) {
		allClients.push(client.handshake.address);
		//io.sockets.emit('all-connections', allClients);
		console.log('User '+client.handshake.address+' conected');
		client.on('msg', function (username,data) {
			var msg={name:username,message:data};
			io.sockets.emit('receive', msg);
		});
		client.on('disconnect', function() {
			var index = allClients.indexOf(client.handshake.address);
			if (index != -1) {
				allClients.splice(index, 1);
				io.sockets.emit('all-connections', allClients);
			}
			console.log('User '+client.handshake.address+' disconnect');
		});
		client.on('login',function(name){
			console.log('User '+name+'  '+client.handshake.address+' logged');
			client.emit('logged',true);
		});
	}
);


console.log("ChattieJS running");

