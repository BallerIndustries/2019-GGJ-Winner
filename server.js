const _ = require('lodash')
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 9876;

const game = require('./game.js')

const TICK_RATE = 30
let moveUpdates = {}

app.use(express.static(__dirname + '/dist'));
app.use('/notified-Category_None', express.static(__dirname + '/dist'));
app.use('/verify-Category_None', express.static(__dirname + '/dist'));

io.on('connection', (socket) => {
  const playerId = socket.id

  console.log(`a user connected playerId = ${playerId}`);
  
  // Event handlers
  socket.on('disconnect', (reason) => {
    game.removePlayer(playerId)
    socket.broadcast.emit('player_left',{id: playerId})
    console.log(`a user has disconnected. playerId = ${playerId} reason = ${JSON.stringify(reason)}`)
  });

  socket.on('game_state',() => {
    console.log('returning game state: ',game.getGameState())
    socket.emit('game_state',{state:game.getGameState()})
  })

  socket.on('send_sow',() => {
    socket.emit('sow',game.getSOW(playerId));
    socket.emit('player_state', game.getPlayerState(playerId));
  })

  socket.on('start_game',() => {
    game.changeState('PRECHAIR')
  })

  socket.on('claim_chair',msg => {
    let success = game.claimChair(playerId,msg.chair_id)
    if(success){
      console.log(`${playerId} claimed chair ${msg.chair_id}`)
      io.emit('chair_taken',{
        chair_id: msg.chair_id,
        player_id: playerId
      })
      game.checkWinCondition()
    }
  })

  socket.on('move_player',(playerState) => {
    //console.log(`playerState = ${JSON.stringify(playerState)}`);
    moveUpdates[playerId] = {id:playerId, x:playerState.x, y: playerState.y, angle: playerState.angle}
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
    game.movePlayer(msg.id,msg.x,msg.y, msg.angle)
  })

  let upd = _.map(moveUpdates,(v,k)=>{
    return {id: k, x: v.x, y: v.y, angle: v.angle}
  })

  moveUpdates = {}
  io.emit('move_player', upd)
}

game.onStateChange('LOBBY','PRECHAIR',(from,to) => {
  io.emit('state_change',{
    from: from,
    to: to
  })
})

game.onStateChange(['CHAIRWINNER','PRECHAIR'],'CHAIR',(from,to) => {
  let chairs = game.getChairs()
  io.emit('state_change',{
    from: from,
    to: to,
    chairs: chairs
  })
})

game.onStateChange('CHAIRWINNER','PRECHAIR',(from,to) => {
  io.emit('state_change',{
    from: from,
    to: to
  })
})

game.onStateChange('CHAIR','CHAIRWINNER',(from,to) => {
  let losers = game.getLosers()
  io.emit('state_change',{
    from: from,
    to: to,
    losers: losers
  })
})

game.onStateChange('PRECHAIR','FINALWINNER',(from,to) => {
  console.log(game.lastPlayer())
  io.emit('state_change',{
    from: from,
    to: to,
    winner: game.lastPlayer()
  })
})


setInterval(tick,Math.floor(1000/TICK_RATE))

server.listen(port, () => console.log(`Musical chairs listening on ${port}`));