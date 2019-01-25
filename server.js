const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const port = process.env.PORT || 9876;

app.use(express.static(__dirname + '/dist'));

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(port, function(){
  console.log(`Musical chairs listening on ${port}`);
});