import Phaser from 'phaser';
import io from 'socket.io-client';

let x = 0;
let y = 0;
let cursors;
let socket;

function main() {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 200 }
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    socket = io()
    setupSocket(socet)
    new Phaser.Game(config);
}

function setupSocket(sock){
    sock.on('connect',() => {
        console.log('socket connected')
    })
}

function preload ()
{
    cursors = this.input.keyboard.createCursorKeys();

    this.load.setBaseURL('/');
    this.load.image('sky', 'assets/space3.png');
    this.load.image('logo', 'assets/phaser3-logo.png');
    this.load.image('red', 'assets/red.png');
}

function update() {
    if (cursors.left.isDown)
    {
        x += 10;
        this.cameras.main.setPosition(x, y);
    }
    else if (cursors.right.isDown)
    {
        x -= 10;
        this.cameras.main.setPosition(x, y);
    }
}

function create ()
{
    this.cameras.main.setBounds(0, 0, 8000, 600);

    this.add.image(400, 300, 'sky');

    const particles = this.add.particles('red');

    const emitter = particles.createEmitter({
        speed: 100,
        scale: { start: 1, end: 0 },
        blendMode: 'ADD'
    });

    const logo = this.physics.add.image(400, 100, 'logo');

    logo.setVelocity(100, 200);
    logo.setBounce(1, 1);
    logo.setCollideWorldBounds(true);
    emitter.startFollow(logo);
}

main();