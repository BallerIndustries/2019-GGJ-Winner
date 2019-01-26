const playerState = {}
const stateChangeMap = {}

const GRID_WIDTH = 800
const GRID_HEIGHT = 600

const GAME_STATES = {
  LOBBY: 'LOBBY',
  PRECHAIR: 'PRECHAIR',
  CHAIR: 'CHAIR',
  CHAIRWINNER: 'CHAIRWINNER',
  FINALWINNER: 'FINALWINNER'
}

let gameState = GAME_STATES.LOBBY

function addPlayer(playerID){
    const x = getRandomInt(0, GRID_WIDTH);
    const y = getRandomInt(0, GRID_HEIGHT);
    const position = { id: playerID, x, y };
  
    playerState[playerID] = position;
    console.log(`player placed at (${x}, ${y})`);
  
    console.log(`playerState = ${JSON.stringify(playerState)}`)
}

function removePlayer(playerID){
    delete playerState[playerID];

    console.log('player removed');
    console.log(`playerState = ${JSON.stringify(playerState)}`)
}

function movePlayer(playerID,x,y){
    gameState[playerID].x = x
    gameState[playerID].y = y
}

function getSOW(){
    return {
        gameState: gameState,
        players: playerState
    }
}

function changeState(to){
    console.log(`Changing state from ${gameState} to ${to}`)
    let ck = stateChangeKey(gameState,to)
    let prevState = gameState
    gameState = to
    if(ck in stateChangeMap){
        stateChangeMap[ck](prevState,to)
    } 
}

function getCurrentState(){
    return gameState
}

function onStateChange(from,to,func){
    stateChangeMap[stateChangeKe(from,to)] = func
}

// ===== MISC =====

// min and max included
function getRandomInt(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

function stateChangeKey(from,to){
    return from + '->' + to
}