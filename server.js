const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 9876;

app.use(express.static(__dirname + '/dist'));

io.on('connection', (socket) => {
  const playerId = socket.id;

  console.log(`a user connected playerId = ${playerId}`);
  placePlayer(playerId);

  socket.on('disconnect', (reason) => {
    removePlayer(playerId);
    console.log(`a user has disconnected. playerId = ${playerId} reason = ${JSON.stringify(reason)}`)
  });
});

const playerState = {};

// Picks a random position on a 400x400 grid
function placePlayer(playerId) {
  const x = getRandomInt(0, 400);
  const y = getRandomInt(0, 400);
  const position = { x, y };

  playerState[playerId] = position;
  console.log(`player placed at (${x}, ${y})`);

  console.log(`playerState = ${JSON.stringify(playerState)}`)
}

function removePlayer(playerId) {
    delete playerState[playerId];

    console.log('player removed');
    console.log(`playerState = ${JSON.stringify(playerState)}`)
}

// min and max included
function getRandomInt(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

server.listen(port, () => console.log(`Musical chairs listening on ${port}`));