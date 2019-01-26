import socket from '../socket'

export default class Name extends Phaser.Scene {

    constructor (){
        super({ key: 'Name' });
        this.name = []
        this.nameText = null
    }

    preload (){
    }

    create (){
        // Setup socket
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
                console.log('logging in')
                this.scene.start('Game',{name: this.name.join('')});
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