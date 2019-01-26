const _ = require('lodash')

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
const MIN_PRECHAIR_WAIT = 5
const MAX_PRECHAIR_WAIT = 15
const CHAIR_ROUND_WAIT = 15

module.exports.addPlayer = addPlayer;
module.exports.getSOW = getSOW;
module.exports.movePlayer = movePlayer;
module.exports.removePlayer = removePlayer;
module.exports.getPlayerState = getPlayerState;

function addPlayer(playerID) {
    const x = getRandomInt(0, GRID_WIDTH);
    const y = getRandomInt(0, GRID_HEIGHT);
    const player = {
        id: playerID, 
        x, 
        y,
        alive: gameState === GAME_STATES.LOBBY
    };

    playerState[playerID] = player;
    console.log(`player placed at (${x}, ${y})`);

    console.log(`playerState = ${JSON.stringify(playerState)}`)
}

function removePlayer(playerID) {
    delete playerState[playerID];

    console.log('player removed');
    console.log(`playerState = ${JSON.stringify(playerState)}`)
}

function movePlayer(playerID, x, y) {
    const player = playerState[playerID]

    if (player === undefined) {
        console.log(`Unable to find player with playerID = ${playerID}`)
        console.log(``)
        return;
    }

    playerState[playerID].x = x
    playerState[playerID].y = y
}

function getPlayerState(playerID) {
    return playerState[playerID]
}

function getSOW(playerID) {
    const enemies = _.pickBy(playerState, (val,key) => {
        return key !== playerID
    })
    return {
        gameState: gameState,
        players: enemies,
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
        for(let f in stateChangeMap[ck]){
            f(prevState, to)
        }
    }
}

function getCurrentState() {
    return gameState
}

function onStateChange(from, to, func) {
    if(Array.isArray(from)){
        for (let f in from){
            onStateChange(f,to,func)
        }
        return
    }
    let ck = stateChangeKey(from, to)
    if(!(ck in stateChangeMap)){
        stateChangeMap[ck] = []
    }
    stateChangeMap[stateChangeKey(from, to)].push(func)
}

function startGame(){
    changeState(GAME_STATES.PRECHAIR)
}

// State handlers

onStateChange([GAME_STATES.LOBBY,GAME_STATES.CHAIR],GAME_STATES.PRECHAIR,(from,to) => {
    let wait_time = getRandomInt(MIN_PRECHAIR_WAIT,MAX_PRECHAIR_WAIT)
    console.log(`Waiting for ${wait_time} seconds for chairs`)

})


// ===== MISC =====

// min and max included
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function stateChangeKey(from, to) {
    return from + '->' + to
}