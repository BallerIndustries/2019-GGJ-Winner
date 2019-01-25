const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 9876;

app.use(express.static(__dirname + '/dist'));

io.on('connection', (socket) => {
  console.log('a user connected');
});

server.listen(port, () => console.log(`Musical chairs listening on ${port}`));