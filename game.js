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

const GRID_WIDTH = 1024
const GRID_HEIGHT = 660
const MIN_PRECHAIR_WAIT = 1
const MAX_PRECHAIR_WAIT = 2
const CHAIR_ROUND_WAIT = 15

module.exports.addPlayer = addPlayer;
module.exports.getSOW = getSOW;
module.exports.getGameState = getGameState;
module.exports.movePlayer = movePlayer;
module.exports.removePlayer = removePlayer;
module.exports.getPlayerState = getPlayerState;
module.exports.onStateChange = onStateChange;
module.exports.changeState = changeState;
module.exports.getChairs = getChairs;

function addPlayer(playerID,name) {
    const x = getRandomInt(0, GRID_WIDTH);
    const y = getRandomInt(0, GRID_HEIGHT);
    const angle = 0;

    const player = {
        id: playerID, 
        x, 
        y,
        angle,
        name,
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

function movePlayer(playerID, x, y, angle) {
    const player = playerState[playerID]

    if (player === undefined) {
        console.log(`Unable to find player with playerID = ${playerID}`)
        return;
    }

    playerState[playerID].x = x
    playerState[playerID].y = y
    playerState[playerID].angle = angle
}

function getPlayerState(playerID) {
    return playerState[playerID]
}

function getGameState(){
    return gameState
}

function getSOW(playerID) {
    const enemies = _.pickBy(playerState, (val,key) => {
        return key !== playerID
    })
    return {
        playerID: playerID,
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

function getChairs() {
    return chairState
}

function numPlayers(){
    return playerState.keys.length
}

function numPlayersAlive(){
    return Object.entries(playerState).filter((entry) => {
        return entry[1].alive
    }).length
}

function changeState(to) {
    console.log(`Changing state from ${gameState} to ${to}`)
    let ck = stateChangeKey(gameState, to)
    let prevState = gameState
    gameState = to
    if (ck in stateChangeMap) {
        for(let f of stateChangeMap[ck]){
            f(prevState, to)
        }
    }
}

function onStateChange(from, to, func) {
    if(Array.isArray(from)){
        for (let f of from){
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

onStateChange([GAME_STATES.LOBBY,GAME_STATES.CHAIR],GAME_STATES.PRECHAIR, (from,to) => {
    // check win condition
    // if(from === 'CHAIR'){
    //     if(gameState.numPlayers <= 1){
    //         changeState(GAME_STATES.FINALWINNER)
    //         return
    //     }
    // }
    let wait_time = getRandomInt(MIN_PRECHAIR_WAIT,MAX_PRECHAIR_WAIT)
    console.log(`Waiting for ${wait_time} seconds for chairs`)
    setTimeout(() => {
        // genreate chairs
        let alive = numPlayersAlive()
        if(alive <= 1){
            changeState(GAME_STATES.FINALWINNER)
            return
        }
        let numchairs = alive - 1
        addChairs(numchairs)
        changeState(GAME_STATES.CHAIR)
    },1000*wait_time)
})

onStateChange(GAME_STATES.PRECHAIR,GAME_STATES.CHAIR, (from,to) => {
    console.log(`Waiting ${CHAIR_ROUND_WAIT}s in chair round`)
})


// ===== MISC =====

// min and max included
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function stateChangeKey(from, to) {
    return from + '->' + to
}