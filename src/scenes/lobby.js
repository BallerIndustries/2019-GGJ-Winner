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
        this.cameras.main.setBackgroundColor('#CCCCCC');

        var style = { font: "bold 40px Arial", fill: "#333", boundsAlignH: "center", boundsAlignV: "middle" }
        this.add.text(20, 10, "Lobby", style);


        style = { font: "bold 40px Arial", fill: "#f44141", boundsAlignH: "center", boundsAlignV: "middle", backgroundColor: '#42b0f4' }
        let startbutton = this.add.text(860, 10, " START ", style);
        startbutton.setInteractive().on('pointerdown', () => {
            this.scene.start('Game',{
                name: this.name,
                player_id: this.player_id
            });
        });

        socket.emit('login',{name: this.name})

    }

    updatePlayers(){
        console.log('updating',this.players)
        var style = { font: "bold 24px Arial", fill: "#444", boundsAlignH: "center", boundsAlignV: "middle" }
        // clear the names
        for(let n of this.names){
            n.destroy()
        }
        let offset = 80
        for(let name in this.players){
            let p = this.players[name]
            let t = this.add.text(100, offset, p.name, style);
            offset += 30
            this.names.push(t)
        }
    }

}