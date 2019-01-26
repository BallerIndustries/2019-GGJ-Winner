import io from 'socket.io-client';

let playerSprite = null;
let cursors = null;
let socket = null;
let game = null;

function main() {
    const config = {
        type: Phaser.AUTO,
        width: 1024,
        height: 660,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {y: 200}
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };

    new Phaser.Game(config);
}

function setupSocket(socket) {
    socket.on('connect', () => {
        console.log('socket connected')
    });

    socket.on('sow',(stateOfWorld) => {
        console.log('Got SOW: ',stateOfWorld)
        createStateOfWorld(stateOfWorld)
    });

    socket.on('your_position', function(playerState) {
        console.log(`Got your_position = ${JSON.stringify(playerState)}`);
        createPlayer(playerState);
    });

    socket.on('new_player',(enemyState) => {
        console.log('New Player Joined: ', enemyState);
        spawnEnemy(enemyState)
    });

    socket.on('player_left',(enemyState) => {
        console.log('Player Left: ', enemyState);
        removeEnemy(enemyState.id);
    });

    socket.on('move_player',(enemyMoveState) => {
        // console.log('Enemy player moved: ', enemyMoveState);
        for(let estate of enemyMoveState){
            // TODO: check for player id here
            moveEnemy(estate)
        }
    });
}

function preload() {
    cursors = this.input.keyboard.createCursorKeys();
    this.load.setBaseURL('/');
    this.load.image('sky', 'assets/space3.png');
    this.load.image('player', 'assets/player/survivor-idle_handgun_0.png')
}

function update() {
    if (playerSprite === null) {
        return
    }

    let hasMoved = false;

    // Tank controls, left and right rotate the sprite.
    if (cursors.left.isDown) {
        playerSprite.angle -= 6;
        hasMoved = true;
    }
    else if (cursors.right.isDown) {
        playerSprite.angle += 6;
        hasMoved = true;
    }

    if (cursors.up.isDown) {
        playerSprite.y -= 6;
        hasMoved = true;
    }
    else if (cursors.down.isDown) {
        playerSprite.y += 6;
        hasMoved = true;
    }

    if (hasMoved) {
        const {x, y, angle} = playerSprite;
        emitMove(x, y, angle)
    }
}

function emitMove(x, y, angle) {
    socket.emit('move_player', {x, y, angle})
}

function create() {
    game = this;
    game.cameras.main.setBackgroundColor('#CCCCCC');

    console.log('created game');
    socket = io();
    setupSocket(socket);
}

function createPlayer(playerState) {
    //debugger
    playerSprite = game.add.image(playerState.x, playerState.y, 'player');
    playerSprite.setScale(0.35);
}

const enemies = {};

function removeEnemy(enemyId) {
    const enemy = enemies[enemyId];

    if (enemy === undefined) {
        console.log(`Woah that was unexpected! Unable to find enemy with enemiyId = ${enemyId}`);
        return;
    }

    // Remove the game object from Phaser
    const {enemyState, enemyGameObject} = enemy;
    enemyGameObject.setActive(false);
    enemyGameObject.setVisible(false);

    // Remove this enemy from our map of enemies
    delete enemy[enemyId]
}

function spawnEnemy(enemyState) {
    const enemyGameObject = game.add.image(enemyState.x, enemyState.y, 'player');
    enemyGameObject.setScale(0.35);
    enemies[enemyState.id] = {enemyState, enemyGameObject}
}

function createStateOfWorld(stateOfWorld) {
    console.log(`createStateOfWorld() stateOfWorld = ${JSON.stringify(stateOfWorld)}`);
    const {players: enemies} = stateOfWorld;
    Object.values(enemies).forEach(enemy => spawnEnemy(enemy))
}

function moveEnemy(enemyMoveState) {
    const {id: enemyId, x, y, angle} = enemyMoveState;
    console.log(`moveEnemy() enemyId = ${enemyId} x = ${x} y = ${y} angle = ${angle}`);
    const enemy = enemies[enemyId];

    if (enemy === undefined) {
        console.log(`Woah that was unexpected! Unable to find enemy with enemiyId = ${enemyId}`);
        return
    }

    const {enemyState, enemyGameObject} = enemy;

    enemyGameObject.x = x;
    enemyGameObject.y = y;
    enemyGameObject.angle = angle;
}

main();