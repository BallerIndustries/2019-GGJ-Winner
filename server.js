const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 9876;

const game = require('./game.js')

app.use(express.static(__dirname + '/dist'));

io.on('connection', (socket) => {
  const playerId = socket.id

  console.log(`a user connected playerId = ${playerId}`);
  game.addPlayer(playerId)

  // Send current player the state of the world
  socket.emit('sow',game.getSOW())
  // Send everyone else that a new player has joined
  socket.broadcast.emit('new_player',playerState[playerId])

  // Event handlers
  socket.on('disconnect', (reason) => {
    game.removePlayer(playerId)
    socket.broadcast.emit('player_left',{id: playerId})
    console.log(`a user has disconnected. playerId = ${playerId} reason = ${JSON.stringify(reason)}`)
  });

  socket.on('move_player',(msg) => {
    game.movePlayer(msg.id,msg.x,msg.y)
    socket.broadcast.emit('move_player',msg)
  })
});

server.listen(port, () => console.log(`Musical chairs listening on ${port}`));