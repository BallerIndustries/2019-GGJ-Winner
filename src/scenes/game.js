import socket from '../socket'
import Phaser from "phaser"

export default class Game extends Phaser.Scene {

    getTimeElapsed() {
        const timeNow = new Date().getTime()
        return timeNow - this.gameStartTime
    }

    constructor ()
    {
        super({ key: 'Game' })
        this.enemies = {}
        this.enemyGroup = null
        this.chairs = {}
        this.walls = []
        this.chairGroup = null
        this.wallGroup = null
        this.playerSprite = null
        this.playerContainer = null
        this.playerCanMove = true
        this.playerAlive = true
        this.player_id = null
        this.name = null
        this.chairMusic = null
        this.gameStartTime = new Date().getTime()
    }

    init(data){
        this.name = data.name
        this.player_id = data.player_id
        this.from = data.from
    }

    preload ()
    {
        this.load.setBaseURL('/')
        this.load.image('sky', 'assets/space3.png')
        this.load.image('player', 'assets/player/survivor-idle_handgun_0.png')
        this.load.image('chair', 'assets/chair.png')
        this.load.image('wall', 'assets/wall.png')
        this.load.audio('chairMusic', 'assets/get-a-fucking-chair.mp3')
    }

    create ()
    {
        this.cameras.main.setBackgroundColor('#CCCCCC')
        this.chairMusic = this.sound.add('chairMusic')

        this.cursors = this.input.keyboard.createCursorKeys()
        this.chairGroup = this.physics.add.group()
        this.wallGroup = this.physics.add.staticGroup()
        this.enemyGroup = this.physics.add.group()
        console.log('created game')
        this.setupSocket(socket)
        console.log('socket set up')
        if(this.from == 'Lobby'){
            socket.emit('send_sow')
        }else{
            socket.emit('login',{name: this.name})
        }

    }

    update()
    {
        //console.log(this.getTimeElapsed())
        // const alteredTime = new Date().getTime() - 100;
        // console.log(`update() alteredTime = ${alteredTime}`)

        if (this.playerSprite === null) {
            return
        }

        // angle 0   -> EAST
        // angle 90  -> SOUTH
        // angle 180 -> WEST
        // angle 270 -> NORTH

        let hasMoved = false
        //console.log('playerSprite.angle = ' + playerSprite.angle);

        // Tank controls, left and right rotate the sprite.
        if (this.cursors.left.isDown) {
            this.playerSprite.angle -= 6
            hasMoved = true
        }
        else if (this.cursors.right.isDown) {
            this.playerSprite.angle += 6
            hasMoved = true
        }

        // const r = 5;
        const radians = degreesToRadians(this.playerSprite.angle - 90)
        const x = (250 * Math.sin(radians))
        const y = (250 * Math.cos(radians))

        if(this.playerCanMove){
            if (this.cursors.up.isDown) {
                this.playerContainer.body.setVelocity(-x, y)
                hasMoved = true
            }
            else if (this.cursors.down.isDown) {
                this.playerContainer.body.setVelocity(x, -y)
                hasMoved = true
            }
            else {
                this.playerContainer.body.setVelocity(0, 0)
            }
        }
        if (hasMoved) {
            const {x, y} = this.playerContainer
            const angle = this.playerSprite.angle
            emitMove(x, y, angle)
        }

        // Lerp the enemy players
        this.lerpEnemies()
    }

    lerpEnemies() {
        const timeOfThePast = this.getTimeElapsed() - 100

        if (!this.enemies) {
            return
        }

        //console.log(`this.enemies = `, this.enemies)
        const enemyArray = Object.values(this.enemies)

        for (let i = 0; i < enemyArray.length; i++) {
            const enemy = enemyArray[i]
            const {currentPosition, nextPosition} = enemy

            if (currentPosition === null || nextPosition === null) {
                continue
            }

            let percentage = (timeOfThePast - currentPosition.time) / (nextPosition.time - currentPosition.time)
            percentage = Phaser.Math.Clamp(percentage, 0.0, 1.0)

            console.log('percentage = ', percentage)

            const from = new Phaser.Math.Vector3(currentPosition.x, currentPosition.y, currentPosition.angle)
            const to = new Phaser.Math.Vector3(nextPosition.x, nextPosition.y, nextPosition.angle)

            const lerpedPosition = from.lerp(to, percentage)

            const {enemyContainer, enemySprite} = enemy;

            enemyContainer.x = lerpedPosition.x;
            enemyContainer.y = lerpedPosition.y;
            enemySprite.angle = lerpedPosition.z;
        }
    }

    spawnPlayer(playerState) {
        const {playerContainer, playerSprite} = this.spawnCharacter(playerState)
        this.playerContainer = playerContainer
        this.playerSprite = playerSprite

        this.tryAddPlayerAndWallsCollider()
    }

    killPlayer(){
        this.playerAlive = false
        this.playerCanMove = false
        this.playerContainer.setVisible(false)
        this.playerContainer.setActive(false)
    }

    tryAddPlayerAndWallsCollider() {
        if (this.playerContainer === null || this.wallGroup === null) {
            console.log("Failed to add player and walls collider. playerContainer or wallGroup is null")
            return
        }

        this.physics.add.collider(this.playerContainer, this.wallGroup)
        console.log("Succesfully added player and walls collider.")
    }

    spawnCharacter(playerState) {
        const {x, y, name} = playerState

        const playerContainer = this.add.container(x, y)
        const playerSprite = this.add.image(0, 0, 'player')
        playerSprite.setScale(0.17)

        const playerNameGameObject = this.add.text(-20, -40, name, {fontSize: '14px', fill: '#000000'})
        playerContainer.add([playerSprite, playerNameGameObject])

        const scaledWidth = playerSprite.width * 0.17
        const scaledHeight = playerSprite.height * 0.17


        const onPlayersCollide = (playerContainer, enemy) => {
            playerContainer.body.stop()
            enemy.body.stop()
            console.log("collission")
        }

        // Add a collider
        playerContainer.setSize(scaledWidth, scaledHeight)
        this.physics.world.enable(playerContainer)
        playerContainer.body.setCircle(17)
        playerContainer.body.setCollideWorldBounds(true)
        this.physics.add.overlap(playerContainer, this.chairGroup,this.onChairCollide, null, this)
        this.physics.add.collider(playerContainer, this.enemyGroup,onPlayersCollide)

        return {playerContainer, playerSprite}
    }

    onChairCollide(player,chair){
        if(chair.taken || chair.collided){
            return
        }
        socket.emit('claim_chair',{
            chair_id: chair.chair_id
        })
    }

    removeEnemy(enemyId) {
        const enemy = this.enemies[enemyId]

        if (enemy === undefined) {
            console.log(`Woah that was unexpected! Unable to find enemy with enemyId = ${enemyId}`)
            return
        }

        // Remove the game object from Phaser
        const {enemyContainer} = enemy
        enemyContainer.setActive(false)
        enemyContainer.setVisible(false)
        this.enemyGroup.remove(enemyContainer)
        // Remove this enemy from our map of enemies
        delete enemy[enemyId]
    }

    spawnEnemy(enemyState) {
        const {x, y} = enemyState
        const angle = 0
        const time = this.getTimeElapsed()
        const currentPosition = {x, y, angle, time}
        const nextPosition = null
        const {playerContainer: enemyContainer, playerSprite: enemySprite} = this.spawnCharacter(enemyState)


        this.enemies[enemyState.id] = {enemyState, enemyContainer, enemySprite, currentPosition, nextPosition}
        enemyContainer.body.setMaxVelocity(0,0)
        enemyContainer.body.setImmovable(true)
        enemyContainer.body.setBounce(0,0)
        enemyContainer.body.setMass(1000)
        enemyContainer.body.setCircle(17)
        this.enemyGroup.add(enemyContainer)
    }

    spawnChair(chair) {
        const chairGameObject = this.physics.add.image(chair.x, chair.y, 'chair')
        chairGameObject.setScale(0.4)
        chairGameObject.depth = -1
        chairGameObject.chair_id = chair.id
        chairGameObject.collided = false
        chairGameObject.taken = chair.taken
        this.chairs[chair.id] = {chair, chairGameObject}
        this.chairGroup.add(chairGameObject)
    }

    createStateOfWorld(stateOfWorld) {

        console.log(`createStateOfWorld() `, stateOfWorld)

        const {players: enemies, wallState} = stateOfWorld
        this.player_id = stateOfWorld.playerID
        Object.values(enemies).forEach(enemy => {
            if(enemy.id !== this.player_id && enemy.alive){
                console.log('spawning',enemy)
                this.spawnEnemy(enemy)
            }
        })

        wallState.forEach(wall => this.createWall(wall))
        this.tryAddPlayerAndWallsCollider()
    }

    createWall({x, y, width, height}) {
        console.log(`createWall() x = ${x} y = ${y} width = ${width} height = ${height}`)

        const movedX = x + (width / 2)
        const movedY = y + (height / 2)
        const scaleX = (width / 32)
        const scaleY = (height / 32)

        this.wallGroup.create(movedX, movedY, 'wall').setScale(scaleX, scaleY).refreshBody()
    }

    moveEnemy(enemyMoveState) {
        const {id: enemyId, x, y, angle} = enemyMoveState
        const enemy = this.enemies[enemyId]

        if (enemy === undefined) {
            console.log(`Woah that was unexpected! Unable to find enemy with enemiyId = ${enemyId}`)
            return
        }

        // Lerp them over instead of
        const {nextPosition} = enemy
        const time = this.getTimeElapsed()

        this.enemies[enemyId].currentPosition = nextPosition
        this.enemies[enemyId].nextPosition = { x, y, angle, time}
    }

    playerTakeChair(id){
        this.stopChairMusic()

        let {chair} = this.chairs[id]
        this.playerContainer.setPosition(chair.x,chair.y)
        this.playerCanMove = false
        this.playerContainer.body.stop()
        emitMove(this.playerContainer.x, this.playerContainer.y, this.playerSprite.angle)
    }

    displayWinner() {
        let style = { font: "bold 70px Arial", fill: "#FF0000", boundsAlignH: "center", boundsAlignV: "middle" }
        this.add.text(240, 300, "YOU WIN :)", style)
    }

    displayLoser() {
        let style = { font: "bold 70px Arial", fill: "#FF0000", boundsAlignH: "center", boundsAlignV: "middle" }
        this.add.text(240, 300, "YOU LOSE :(", style)
    }
    playChairMusic() {
        this.chairMusic.play()
    }

    stopChairMusic() {
        this.chairMusic.stop()
    }

    setupSocket(socket) {
        const self = this
        socket.removeAllListeners()
        socket.on('connect', () => {
            console.log('socket connected')
        })

        socket.on('sow',(stateOfWorld) => {
            console.log('Got SOW: ',stateOfWorld)
            self.createStateOfWorld(stateOfWorld)
        })

        socket.on('player_state', function(playerState) {
            console.log(`Got playerState = `, playerState)

            if (playerState.alive) {
                self.spawnPlayer(playerState)
            }
        })

        socket.on('new_player',(enemyState) => {
            console.log('New Player Joined: ', enemyState)

            if(enemyState.alive) {
                self.spawnEnemy(enemyState)
            }
        })

        socket.on('player_left',(enemyState) => {
            console.log('Player Left: ', enemyState)
            self.removeEnemy(enemyState.id)
        })

        socket.on('move_player',(enemyMoveStates) => {
            enemyMoveStates.forEach(enemyMoveState => self.moveEnemy(enemyMoveState))
        })

        socket.on('chair_taken', msg => {
            console.log('Chair taken: ',msg)
            console.log(self.player_id)
            if(self.player_id === msg.player_id){
                console.log('thats you!')
                self.playerTakeChair(msg.chair_id)
            }else{
                self.chairs[msg.chair_id].chairGameObject.taken = true
            }
        })

        socket.on('state_change',(msg) => {
            const {from,to} = msg

            if(from === 'PRECHAIR' && to === 'CHAIR'){
                this.playChairMusic()

                console.log('Changed to CHAIR state')
                let chairs = msg.chairs
                console.log(chairs)
                for(let c of chairs){
                    self.spawnChair(c)
                }
                return
            }

            if(from === 'CHAIR' && to === 'CHAIRWINNER'){
                let losers = msg.losers
                console.log('losers',losers)
                for(let l of losers){
                    if(l === self.player_id){
                        self.killPlayer()
                        continue
                    }
                    const enemy = self.enemies[l]

                    if (enemy === undefined) {
                        console.log(`Woah that was unexpected! Unable to find enemy with enemyId = ${l}`)
                        continue
                    }

                    // Remove the game object from Phaser
                    const {enemyContainer} = enemy
                    console.log('enemy',enemy)
                    enemyContainer.setActive(false)
                    enemyContainer.setVisible(false)
                    console.log('fuck you')
                }
            }

            if(from === 'CHAIRWINNER' && to === 'PRECHAIR'){
                console.log(self.chairGroup.getChildren())
                let lame = []
                self.chairGroup.getChildren().map(child => {
                    console.log(child)
                    lame.push(child)
                })
                lame.map(child => child.destroy())
                console.log('done')
                if(self.playerAlive){
                    self.playerCanMove = true
                }
            }

            if(to === 'FINALWINNER'){
                if(msg.winner === self.player_id){
                    self.displayWinner()
                }else{
                    self.displayLoser()
                }

                setTimeout(() => window.location.reload(), 8000)
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