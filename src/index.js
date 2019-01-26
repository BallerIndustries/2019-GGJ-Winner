
import Name from './scenes/name'
import Game from './scenes/game'
import Lobby from './scenes/lobby'

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
        scene: [Name, Lobby, Game]
    };

    new Phaser.Game(config);
}

main();