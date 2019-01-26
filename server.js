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
  
  // Event handlers
  socket.on('disconnect', (reason) => {
    game.removePlayer(playerId)
    socket.broadcast.emit('player_left',{id: playerId})
    console.log(`a user has disconnected. playerId = ${playerId} reason = ${JSON.stringify(reason)}`)
  });
  
  socket.on('move_player',(msg) => {
    moveUpdates[playerId] = {id:playerId, x:msg.x, y: msg.y}
  })
  
  socket.on('login',msg => {
    console.log(`${playerId} logging in with name: ${msg.name}`)
    game.addPlayer(playerId,msg.name)
    // Send current player the state of the world
    socket.emit('sow',game.getSOW(playerId));
    socket.emit('player_state', game.getPlayerState(playerId));
    // Send everyone else that a new player has joined
    socket.broadcast.emit('new_player', game.getPlayerState(playerId))
  })
});

function tick(){
  if(0 === Object.keys(moveUpdates).length){
    return
  }
  _.each(moveUpdates,(msg,k) => {
    game.movePlayer(msg.id,msg.x,msg.y)
  })
  let upd = _.map(moveUpdates,(v,k)=>{
    return {id: k, x: v.x, y: v.y}
  })
  moveUpdates = {}
  io.emit('move_player',upd)
}

setInterval(tick,Math.floor(1000/TICK_RATE))

server.listen(port, () => console.log(`Musical chairs listening on ${port}`));