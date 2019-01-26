import Phaser from 'phaser';
import io from 'socket.io-client';

let cursors;
let socket;
let x = 0;
let y = 0;

function main() {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
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

    socket = io();
    setupSocket(socket);
    new Phaser.Game(config);
}

function setupSocket(socket) {
    socket.on('connect', () => {
        console.log('socket connected')
    })

    sock.on('sow',(msg) => {
        console.log('Got SOW: ',msg)
    })

    sock.on('new_player',(msg) => {
        console.log('New Player Joined: ',msg)
    })

    sock.on('player_left',(msg) => {
        console.log('Player Left: ',msg)
    })
}

function preload() {
    cursors = this.input.keyboard.createCursorKeys();
    this.load.setBaseURL('/');
    this.load.image('sky', 'assets/space3.png');
    this.load.image('player', 'assets/player/survivor-idle_handgun_0.png')
}

function update() {

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

let player;

function create() {
    player = this.add.image(400, 300, 'player');
}

main();