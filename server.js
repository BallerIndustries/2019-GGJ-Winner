const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const port = 3000;

app.use(express.static('dist'));

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));