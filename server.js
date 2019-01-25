const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const port = process.env.PORT || 9876;

app.use(express.static(__dirname + '/dist'));

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(3000, function(){
  console.log('Socket IO listening on 3000');
});

app.listen(port, () => console.log(`Musical chairs listening on port ${port}!`));