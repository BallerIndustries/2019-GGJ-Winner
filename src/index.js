
import Name from './scenes/name'
import Game from './scenes/game'

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
        // scene: {
        //     preload: preload,
        //     create: create,
        //     update: update
        // }
        scene: [Name, Game]
    };

    new Phaser.Game(config);
}

main();