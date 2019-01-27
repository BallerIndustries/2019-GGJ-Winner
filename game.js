const _ = require('lodash')

const GRID_WIDTH = 1024
const GRID_HEIGHT = 660
const MIN_PRECHAIR_WAIT = 1
const MAX_PRECHAIR_WAIT = 2
const CHAIR_ROUND_WAIT = 30
const CHAIRWINNER_ROUND_WAIT = 3

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
let wallState = generateWalls(); // A Wall is a rectangle with {x, y, width, height}

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
module.exports.resetRound = resetRound;

function addPlayer(playerID,name) {
    // const x = getRandomPointOutsideOfWalls(wallState);
    // const y = getRandomPointOutsideOfWalls(wallState);

    const {x, y} = getRandomPointOutsideOfWalls(wallState);

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
        chairs: chairState,
        wallState,
    }
}

function claimChair(playerID,chairID){
    if(!(chairID in chairState)){
        return false
    }
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
    for(let i = 0;i < n;i++) {
        const { x, y } = getRandomPointOutsideOfWalls(wallState);

        chairState.push({
            id: i,
            x: x,
            y: y,
            taken: false,
            player: null
        })
    }
}

function getRandomPointOutsideOfWalls(wallState) {
    let pointIsInWalls = false;
    let x;
    let y;

    const wallContainsPoint = (wall, x, y) => {
        return x > wall.x && x < wall.x + wall.width && y > wall.y && y < wall.y + wall.height;
    };

    do {
        pointIsInWalls = false
        x = getRandomInt(20, GRID_WIDTH - 20);
        y = getRandomInt(20, GRID_HEIGHT - 20);

        for (let i = 0; i < wallState.length; i++) {

            const wall = wallState[i];

            if (wallContainsPoint(wall, x, y)) {
                pointIsInWalls = true;
                break;
            }
        }
    } while (pointIsInWalls)

    const point = {x, y}

    console.log('getRandomPointOutsideOfWalls() = ', point);
    return point
}

function getChairs() {
    return chairState
}

function numPlayers(){
    return Object.keys(playerState).length
}

function numPlayersAlive(){
    return Object.entries(playerState).filter((entry) => {
        return entry[1].alive
    }).length
}

function numChairs(){
    return Object.keys(chairState).length
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
    console.log('chairs taken',numChairs(),numChairsTaken(),isAllChairsTaken())
    let cond = isAllChairsTaken() || numPlayersAlive() <= 1
    if(cond){
        console.log('game has been won')
        // make everyone who lost dead
        let losers = getLosers()
        console.log(losers)
        for(let l of losers){
            console.log(l)
            playerState[l].alive = false
        }
        changeState(GAME_STATES.CHAIRWINNER)
        if(timer){
            clearTimeout(timer)
            timer = null
        }
    }
    return cond
}

function getLosers(){
    let l = Object.entries(playerState).filter(x => {
        return !(x[1].sitting)
    })
    return l.map(x => x[0])
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

onStateChange([GAME_STATES.LOBBY,GAME_STATES.CHAIR,GAME_STATES.CHAIRWINNER],GAME_STATES.PRECHAIR, (from,to) => {
    let wait_time = getRandomInt(MIN_PRECHAIR_WAIT,MAX_PRECHAIR_WAIT)
    console.log(`Waiting for ${wait_time} seconds for chairs`)
    resetRound()
    setTimeout(() => {
        // genreate chairs
        let alive = numPlayersAlive()
        if(alive <= 1){
            changeState(GAME_STATES.FINALWINNER)
            return
        }
        let numchairs = alive - 1
        console.log('added ',numchairs,' chairs')
        addChairs(numchairs)
        console.log(getChairs())
        changeState(GAME_STATES.CHAIR)
    },1000*wait_time)
})

onStateChange(GAME_STATES.PRECHAIR,GAME_STATES.CHAIR, (from,to) => {
    console.log(`Waiting ${CHAIR_ROUND_WAIT}s in chair round`)
    timer = setTimeout(()=> {
        console.log('Time has run out')
        let res = checkWinCondition()
        if(!res){
            changeState(GAME_STATES.CHAIRWINNER)
        }
    },CHAIR_ROUND_WAIT*1000)
})

onStateChange(GAME_STATES.CHAIR,GAME_STATES.CHAIRWINNER, (from,to) => {
    let res = checkWinCondition()
    if(!res){
        setTimeout(() => {
            changeState(GAME_STATES.PRECHAIR)
        },CHAIRWINNER_ROUND_WAIT*1000)
    }
})

// ===== MISC =====

// min and max included
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function stateChangeKey(from, to) {
    return from + '->' + to
}

// TRUMP TRUMP TRUMP TRUMP TRUMP
function generateWalls() {
    // Grid is 1024 x 660

    // Generate walls at intervals of 40?

    // Hardcode the walls for now?
    const generateWall = (x, y, width, height) => {
        return {x, y, width, height}
    };

    // Lets have a plus sign
    const plusSize = 400;
    const wallWidth = 50;

    const horizontalWallX = (GRID_WIDTH - plusSize) / 2;
    const horizontalWallY = (GRID_HEIGHT - wallWidth) / 2;

    const verticalWallX = (GRID_WIDTH - wallWidth) / 2;
    const verticalWallY = (GRID_HEIGHT - plusSize) / 2;

    const walls =  [
        // Horizontal part of the plus
        generateWall(horizontalWallX, horizontalWallY, 400, 50),

        // Vertical part of the plus
        generateWall(verticalWallX, verticalWallY, 50, 400)
    ]

    console.log(JSON.stringify(walls))

    return walls
}