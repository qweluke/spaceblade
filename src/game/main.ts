import { Boot } from './scenes/Boot'
import { GameOver } from './scenes/GameOver'
import { GameScene as MainGame } from './scenes/GameScene'
import { MainMenu } from './scenes/MainMenu'
import { AUTO, Game } from 'phaser'
import { Preloader } from './scenes/Preloader'

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',

    backgroundColor: '#000000',

    // ZMIANA 2: Dodanie bloku fizyki (KLUCZOWE!)
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
        },
    },

    scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
}

export function StartGame(parent: string) {
    return new Game({ ...config, parent })
}

export default StartGame
