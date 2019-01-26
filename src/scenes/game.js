import socket from '../socket'

export default class Game extends Phaser.Scene {

    constructor ()
    {
        super({ key: 'Game' });
        this.enemies = {};
        this.chairs = {}
        this.playerSprite = null;
        this.playerContainer = null;
        this.player_id = null
        this.name = null
    }

    init(data){
        this.name = data.name
        this.player_id = data.player_id
        this.from = data.from
    }

    preload ()
    {
        this.load.setBaseURL('/');
        this.load.image('sky', 'assets/space3.png');
        this.load.image('player', 'assets/player/survivor-idle_handgun_0.png')
        this.load.image('chair', 'assets/chair.png')
    }

    create ()
    {
        this.cameras.main.setBackgroundColor('#CCCCCC');
        this.cursors = this.input.keyboard.createCursorKeys();
        console.log('created game');
        this.setupSocket(socket);
        console.log('socket set up')
        if(this.from == 'Lobby'){
            socket.emit('send_sow')
        }else{
            socket.emit('login',{name: this.name})
        }
        
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

        if (this.cursors.up.isDown) {
            this.playerContainer.x -= x;
            this.playerContainer.y += y;
            hasMoved = true;
        }
        else if (this.cursors.down.isDown) {
            this.playerContainer.x += x;
            this.playerContainer.y -= y;
            hasMoved = true;
        }

        if (hasMoved) {
            const {x, y} = this.playerContainer;
            const angle = this.playerSprite.angle;
            emitMove(x, y, angle)
        }
    }
    
    spawnPlayer(playerState) {
        const {playerContainer, playerSprite} = this.spawnCharacter(playerState);
        this.playerContainer = playerContainer;
        this.playerSprite = playerSprite;
    }

    spawnCharacter(playerState) {
        const {x, y, name} = playerState;

        const playerContainer = this.add.container(x, y);
        const playerSprite = this.add.image(0, 0, 'player');
        playerSprite.setScale(0.17);

        const playerNameGameObject = this.add.text(-20, -40, name, {fontSize: '14px', fill: '#000000'});
        playerContainer.add([playerSprite, playerNameGameObject]);
        return {playerContainer, playerSprite};
    }

    removeEnemy(enemyId) {
        const enemy = this.enemies[enemyId];
    
        if (enemy === undefined) {
            console.log(`Woah that was unexpected! Unable to find enemy with enemyId = ${enemyId}`)
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
        const {playerContainer: enemyContainer, playerSprite: enemySprite} = this.spawnCharacter(enemyState);
        this.enemies[enemyState.id] = {enemyState, enemyContainer, enemySprite}
    }

    spawnChair(chair) {
        const chairGameObject = this.add.image(chair.x, chair.y, 'chair');
        chairGameObject.setScale(0.4);
        chairGameObject.depth = -1
        this.chairs[chair.id] = {chair, chairGameObject}
        this.chairCollisionGroup
    }
    
    createStateOfWorld(stateOfWorld) {
        console.log(`createStateOfWorld() stateOfWorld = ${JSON.stringify(stateOfWorld)}`);
        const {players: enemies} = stateOfWorld;
        Object.values(enemies).forEach(enemy => {
            if(enemy.id !== this.player_id){
                this.spawnEnemy(enemy)
            }
        })
    }
    
    moveEnemy(enemyMoveState) {
        const {id: enemyId, x, y, angle} = enemyMoveState;
        //console.log(`moveEnemy() enemyId = ${enemyId} x = ${x} y = ${y}`);
        const enemy = this.enemies[enemyId];
    
        if (enemy === undefined) {
            //console.log(`Woah that was unexpected! Unable to find enemy with enemiyId = ${enemyId}`);
            return
        }
    
        const {enemyState, enemyContainer, enemySprite} = enemy;

        enemyContainer.x = x;
        enemyContainer.y = y;
        enemySprite.angle = angle;
    }

    setupSocket(socket) {
        const self = this
        socket.removeAllListeners()
        socket.on('connect', () => {
            console.log('socket connected')
        });
    
        socket.on('sow',(stateOfWorld) => {
            console.log('Got SOW: ',stateOfWorld);
            self.createStateOfWorld(stateOfWorld);
        });
    
        socket.on('player_state', function(playerState) {
            console.log(`Got your_position = ${JSON.stringify(playerState)}`);
            self.spawnPlayer(playerState);
        });
    
        socket.on('new_player',(enemyState) => {
            console.log('New Player Joined: ', enemyState);
            self.spawnEnemy(enemyState);
        });
    
        socket.on('player_left',(enemyState) => {
            console.log('Player Left: ', enemyState);
            self.removeEnemy(enemyState.id);
        });
    
        socket.on('move_player',(enemyMoveStates) => {
            enemyMoveStates.forEach(enemyMoveState => self.moveEnemy(enemyMoveState));
        });

        socket.on('state_change',(msg) => {
            const {from,to} = msg
            if(from === 'PRECHAIR' && to === 'CHAIR'){
                console.log('Changed to CHAIR state')
                let chairs = msg.chairs
                for(let c of chairs){
                    self.spawnChair(c)
                }
                return
            }
        })
    }
}

function degreesToRadians(degrees) {
    return (degrees / 180.0) * Math.PI
}

function emitMove(x, y, angle) {
    socket.emit('move_player', {x, y, angle})
}