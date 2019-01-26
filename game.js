const GAME_STATES = {
    LOBBY: 'LOBBY',
    PRECHAIR: 'PRECHAIR',
    CHAIR: 'CHAIR',
    CHAIRWINNER: 'CHAIRWINNER',
    FINALWINNER: 'FINALWINNER'
};

const playerState = {}
const stateChangeMap = {}
let chairState = []
let gameState = GAME_STATES.LOBBY

const GRID_WIDTH = 800
const GRID_HEIGHT = 600


module.exports.addPlayer = addPlayer;
module.exports.getSOW = getSOW;
module.exports.movePlayer = movePlayer;
module.exports.removePlayer = removePlayer;
module.exports.getPlayerState = getPlayerState;

function addPlayer(playerID) {
    const x = getRandomInt(0, GRID_WIDTH);
    const y = getRandomInt(0, GRID_HEIGHT);
    const position = {id: playerID, x, y};

    playerState[playerID] = position;
    console.log(`player placed at (${x}, ${y})`);

    console.log(`playerState = ${JSON.stringify(playerState)}`)
}

function removePlayer(playerID) {
    delete playerState[playerID];

    console.log('player removed');
    console.log(`playerState = ${JSON.stringify(playerState)}`)
}

function movePlayer(playerID, x, y) {
    gameState[playerID].x = x
    gameState[playerID].y = y
}

function getPlayerState(playerID) {
    return playerState[playerID]
}

function getSOW() {
    return {
        gameState: gameState,
        players: playerState,
        chairs: chairState
    }
}

function claimChair(playerID,chairID){
    chair = chairState[chairID]
    if(chair.taken){
        return false
    }
    chairState[chairID].taken = true
    chairState[chairID].player = playerID
    console.log(`${playerID} took chair ${chairID}`)
    return true
}

function clearChairs() {
    chairState = []
}

function addChairs(n){
    for(let i = 0;i < n;i++){
        chairState.push({
            id: i,
            x: getRandomInt(0, GRID_WIDTH),
            y: getRandomInt(0, GRID_HEIGHT),
            taken: false,
            player: null
        })
    }
}

function numPlayers(){
    return playerState.keys.length
}

function changeState(to) {
    console.log(`Changing state from ${gameState} to ${to}`)
    let ck = stateChangeKey(gameState, to)
    let prevState = gameState
    gameState = to
    if (ck in stateChangeMap) {
        stateChangeMap[ck](prevState, to)
    }
}

function getCurrentState() {
    return gameState
}

function onStateChange(from, to, func) {
    stateChangeMap[stateChangeKey(from, to)] = func
}

// ===== MISC =====

// min and max included
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function stateChangeKey(from, to) {
    return from + '->' + to
}