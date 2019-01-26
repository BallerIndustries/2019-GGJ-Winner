const _ = require('lodash')
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 9876;

const game = require('./game.js')

const TICK_RATE = 60
let moveUpdates = {}

app.use(express.static(__dirname + '/dist'));

io.on('connection', (socket) => {
  const playerId = socket.id

  console.log(`a user connected playerId = ${playerId}`);
  game.addPlayer(playerId)

  // Send current player the state of the world
  socket.emit('sow',game.getSOW(playerId));
  socket.emit('your_position', game.getPlayerState(playerId));

  // Send everyone else that a new player has joined
  socket.broadcast.emit('new_player', game.getPlayerState(playerId))

  // Event handlers
  socket.on('disconnect', (reason) => {
    game.removePlayer(playerId)
    socket.broadcast.emit('player_left',{id: playerId})
    console.log(`a user has disconnected. playerId = ${playerId} reason = ${JSON.stringify(reason)}`)
  });

  socket.on('move_player',(msg) => {
    moveUpdates[playerId] = msg
  })
});

function tick(){
  if(0 === Object.keys(moveUpdates).length){
    return
  }
  console.log(moveUpdates)
  for(let msg in moveUpdates){
    game.movePlayer(playerId,msg.x,msg.y)
  }
  let upd = _.each(moveUpdates,(v,k)=>{
    return {id: k, x: v.x, y: v.y}
  })
  moveUpdates = {}
  io.emit('move_player',upd)
}

setInterval(tick,Math.floor(1000/TICK_RATE))

server.listen(port, () => console.log(`Musical chairs listening on ${port}`));