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
let timer = null

const GRID_WIDTH = 1024
const GRID_HEIGHT = 660
const MIN_PRECHAIR_WAIT = 1
const MAX_PRECHAIR_WAIT = 2
const CHAIR_ROUND_WAIT = 15
const CHAIRWINNER_ROUND_WAIT = 5

module.exports.addPlayer = addPlayer;
module.exports.getSOW = getSOW;
module.exports.getGameState = getGameState;
module.exports.movePlayer = movePlayer;
module.exports.removePlayer = removePlayer;
module.exports.getPlayerState = getPlayerState;
module.exports.onStateChange = onStateChange;
module.exports.changeState = changeState;
module.exports.getChairs = getChairs;
module.exports.claimChair = claimChair;
module.exports.numChairs = numChairs;
module.exports.numChairsTaken = numChairsTaken;
module.exports.isAllChairsTaken = isAllChairsTaken;
module.exports.checkWinCondition = checkWinCondition;
module.exports.getLosers = getLosers;

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
        alive: gameState === GAME_STATES.LOBBY,
        sitting: false
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
    playerState[playerID].sitting = true
    console.log(`${playerID} took chair ${chairID}`)
    return true
}

function resetRound() {
    chairState = []
    for(let p in playerState){
        playerState[p].sitting = false
    }
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

function numChairs(){
    return chairState.keys.length
}

function numChairsTaken(){
    return Object.entries(chairState).filter((entry) => {
        return entry[1].taken
    }).length
}

function isAllChairsTaken(){
    return numChairs() === numChairsTaken()
}

function checkWinCondition(){
    console.log('checking win condition')
    let cond = isAllChairsTaken() || numPlayersAlive() <= 1
    if(cond){
        console.log('game has been won')
        // make everyone who lost dead
        let losers = getLosers()
        for(let l of losers){
            playerState[l].alive = false
        }
        changeState(GAME_STATES.CHAIRWINNER)
        if(timer){
            clearTimeout(timer)
            timer = null
        }
    }
}

function getLosers(){
    return Object.entries(playerState).filter(x => {
        return !x[1].sitting
    }).map(x => x.id)
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
    timer = setTimeout(()=> {
        console.log('Time has run out')
        changeState(GAME_STATES.CHAIRWINNER)
    },CHAIRWINNER_ROUND_WAIT*1000)
})

onStateChange(GAME_STATES.CHAIR,GAME_STATES.CHAIRWINNER, (from,to) => {
    
})

// ===== MISC =====

// min and max included
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function stateChangeKey(from, to) {
    return from + '->' + to
}