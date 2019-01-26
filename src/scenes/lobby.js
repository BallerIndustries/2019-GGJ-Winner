import socket from '../socket'

export default class Name extends Phaser.Scene {

    constructor (){
        super({ key: 'Lobby' });
        this.players = {}
        this.player_id = null
        this.names = []
    }

    init(data){
        this.name = data.name
    }

    preload (){
    }

    create (){
        let self = this
        // Setup socket
        socket.removeAllListeners()
        socket.on('sow',function(msg){
            console.log('sow',msg)
            self.players = msg.players
            self.playerid = msg.id
            self.updatePlayers()
        })
        socket.on('new_player',function(msg){
            self.players[msg.id] = msg
            self.updatePlayers()
        })
        socket.on('player_left',function(msg){
            delete self.players[msg.id]
            self.updatePlayers()
        })
        socket.on('state_change',function(msg){
            if(msg.from === 'LOBBY' && msg.to === 'PRECHAIR'){
                self.scene.start('Game',{
                    name: self.name,
                    player_id: self.player_id,
                    from: 'Lobby'
                });
            }
        })
        this.cameras.main.setBackgroundColor('#CCCCCC');

        var style = { font: "bold 40px Arial", fill: "#333", boundsAlignH: "center", boundsAlignV: "middle" }
        this.add.text(20, 10, "Lobby", style);


        style = { font: "bold 40px Arial", fill: "#f44141", boundsAlignH: "center", boundsAlignV: "middle", backgroundColor: '#42b0f4' }
        let startbutton = this.add.text(860, 10, " START ", style);
        startbutton.setInteractive().on('pointerdown', () => {
            socket.emit('start_game')
        });

        socket.emit('login',{name: this.name})

    }

    updatePlayers(){
        var style = { font: "bold 24px Arial", fill: "#444", boundsAlignH: "center", boundsAlignV: "middle" }
        // clear the names
        for(let n of this.names){
            n.destroy()
        }
        let offset = 80
        this.names.push(this.add.text(100, offset, this.name, style))
        for(let name in this.players){
            offset += 30
            let p = this.players[name]
            let t = this.add.text(100, offset, p.name, style);
            this.names.push(t)
        }
    }

}