import Phaser from 'phaser';
import io from 'socket.io-client';

let player = null;
let cursors = null;
let socket = null;

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

    socket.on('sow',(msg) => {
        console.log('Got SOW: ',msg)
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
}

function preload() {
    cursors = this.input.keyboard.createCursorKeys();
    this.load.setBaseURL('/');
    this.load.image('sky', 'assets/space3.png');
    this.load.image('player', 'assets/player/survivor-idle_handgun_0.png')
}

function update() {
    if (player === null) {
        return
    }

    if (cursors.left.isDown) {
        player.x -= 10;
    }
    else if (cursors.right.isDown) {
        player.x += 10;
    }

    if (cursors.up.isDown) {
        player.y -= 10;
    }
    else if (cursors.down.isDown) {
        player.y += 10;
    }
}

let game = null;

function create() {
    game = this;
    game.cameras.main.setBackgroundColor('#CCCCCC');

    console.log('created game');
    socket = io();
    setupSocket(socket);
}

function createPlayer(playerState) {
    //debugger
    player = game.add.image(playerState.x, playerState.y, 'player');
    player.setScale(0.35)
}

const enemies = {};

function removeEnemy(enemyId) {
    const enemy = enemies[enemyId];

    if (enemy === undefined) {
        console.log(`Woah that was unexpected! Unable to find enemy with enemiyId = ${enemyId}`)
        return
    }

    // Remove the game object from Phaser
    const {enemyState, enemyGameObject} = enemy
    enemyGameObject.setActive(false)
    enemyGameObject.setVisible(false)

    // Remove this enemy from our map of enemies
    delete enemy[enemyId]
}

function spawnEnemy(enemyState) {
    const enemyGameObject = game.add.image(enemyState.x, enemyState.y, 'player');
    enemyGameObject.setScale(0.35);
    enemies[enemyState.id] = {enemyState, enemyGameObject}
}

main();