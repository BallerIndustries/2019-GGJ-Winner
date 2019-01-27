import socket from '../socket'

export default class Name extends Phaser.Scene {

    constructor (){
        super({ key: 'Name' });
        this.name = []
        this.nameText = null
        this.game_state_label = null
    }

    preload (){
    }

    create (){
        // Setup socket
        let self = this
        socket.on('game_state',function(msg){
            self.game_state_label = msg.state
        })
        socket.emit('game_state')
        this.cameras.main.setBackgroundColor('#CCCCCC');

        var style = { font: "bold 40px Arial", fill: "#333", boundsAlignH: "center", boundsAlignV: "middle" };
        this.add.text(20, 10, "Musical Chairs!", style);
        
        style = { font: "bold 30px Arial", fill: "#333", boundsAlignH: "center", boundsAlignV: "middle" };
        this.add.text(180, 300, "Enter Your Name: ", style);

        style = { font: "bold 30px Arial", fill: "#555", boundsAlignH: "center", boundsAlignV: "middle" };
        this.nameText = this.add.text(440, 300, this.name, style);
        this.input.manager.enabled = true
        this.input.keyboard.on('keydown', function(e){
            let key = e.key
            if(key === 'Enter' && this.name.length > 0){
                let dest = null
                console.log(this.name)
                if(this.game_state_label === 'LOBBY'){
                    dest = 'Lobby'
                }else{
                    dest = 'Game'
                }
                console.log('going to: ',dest)

                let playerName = this.name.join('');

                if (playerName.toLowerCase().indexOf("kous") >= 0) {
                    playerName = "LOSER"
                }

                this.scene.start(dest,{name: playerName, from: 'Name'});
            }
            if(this.name.length >= 10){
                return
            }
            if(key.length > 1){
                return
            }
            let cc = key.charCodeAt(0)
            if(cc < 32 || cc>176){
                return
            }
            this.name.push(key)
            this.nameText.setText(this.name.join(''))
        }, this);
    }

}