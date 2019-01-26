import socket from '../socket'

export default class Game extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'Game' });
        this.enemies = {}
        this.playerSprite = null
    }

    preload ()
    {
        this.load.setBaseURL('/');
        this.load.image('sky', 'assets/space3.png');
        this.load.image('player', 'assets/player/survivor-idle_handgun_0.png')
    }

    create ()
    {
        this.cameras.main.setBackgroundColor('#CCCCCC');
        this.cursors = this.input.keyboard.createCursorKeys();
        console.log('created game');
        this.setupSocket(socket);
        console.log('socket set up')
        socket.emit('send_sow')
        
    }

    update()
    {
        if (this.playerSprite === null) {
            return
        }

        // angle 0   -> EAST
        // angle 90  -> SOUTH
        // angle 180 -> WEST
        // angle 270 -> NORTH

        let hasMoved = false;
        //console.log('playerSprite.angle = ' + playerSprite.angle);

        // Tank controls, left and right rotate the sprite.
        if (this.cursors.left.isDown) {
            this.playerSprite.angle -= 6;
            hasMoved = true;
        }
        else if (this.cursors.right.isDown) {
            this.playerSprite.angle += 6;
            hasMoved = true;
        }

        // const r = 5;
        const radians = degreesToRadians(this.playerSprite.angle - 90);
        const x = (6 * Math.sin(radians));
        const y = (6 * Math.cos(radians));
        console.log(`x = ${x} y = ${y}`);

        if (this.cursors.up.isDown) {
            this.playerSprite.x -= x;
            this.playerSprite.y += y;
            hasMoved = true;
        }
        else if (this.cursors.down.isDown) {
            this.playerSprite.x += x;
            this.playerSprite.y -= y;
            hasMoved = true;
        }

        if (hasMoved) {
            const {x, y, angle} = this.playerSprite;
            emitMove(x, y, angle)
        }
    }
    
    createPlayer(playerState) {
        //debugger
        this.playerSprite = this.add.image(playerState.x, playerState.y, 'player');
        this.playerSprite.setScale(0.35)
    }

    removeEnemy(enemyId) {
        const enemy = this.enemies[enemyId];
    
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

    spawnEnemy(enemyState) {
        const enemyGameObject = this.add.image(enemyState.x, enemyState.y, 'player');
        enemyGameObject.setScale(0.35);
        this.enemies[enemyState.id] = {enemyState, enemyGameObject}
    }
    
    createStateOfWorld(stateOfWorld) {
        console.log(`createStateOfWorld() stateOfWorld = ${JSON.stringify(stateOfWorld)}`);
        const {players: enemies} = stateOfWorld;
        Object.values(enemies).forEach(enemy => this.spawnEnemy(enemy))
    }
    
    moveEnemy(enemyMoveState) {
        const {id: enemyId, x, y} = enemyMoveState;
        //console.log(`moveEnemy() enemyId = ${enemyId} x = ${x} y = ${y}`);
        const enemy = this.enemies[enemyId];
    
        if (enemy === undefined) {
            //console.log(`Woah that was unexpected! Unable to find enemy with enemiyId = ${enemyId}`);
            return
        }
    
        const {enemyState, enemyGameObject} = enemy;
    
        enemyGameObject.x = x;
        enemyGameObject.y = y;
    }

    setupSocket(socket) {
        const self = this
        socket.removeAllListeners()
        socket.on('connect', () => {
            console.log('socket connected')
        });
    
        socket.on('sow',(stateOfWorld) => {
            console.log('Got SOW: ',stateOfWorld)
            self.createStateOfWorld(stateOfWorld)
        });
    
        socket.on('player_state', function(playerState) {
            console.log(`Got your_position = ${JSON.stringify(playerState)}`);
            self.createPlayer(playerState);
        });
    
        socket.on('new_player',(enemyState) => {
            console.log('New Player Joined: ', enemyState);
            self.spawnEnemy(enemyState)
        });
    
        socket.on('player_left',(enemyState) => {
            console.log('Player Left: ', enemyState);
            self.removeEnemy(enemyState.id);
        });
    
        socket.on('move_player',(enemyMoveState) => {
            // console.log('Enemy player moved: ', enemyMoveState);
            for(let estate of enemyMoveState){
                // TODO: check for player id here
                self.moveEnemy(estate)
            }
        })
    }
}

function degreesToRadians(degrees) {
    return (degrees / 180.0) * Math.PI
}


function emitMove(x, y) {
    socket.emit('move_player', {x, y})
}