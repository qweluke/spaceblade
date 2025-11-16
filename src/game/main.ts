import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { GameScene as MainGame } from './scenes/GameScene';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    
    // ZMIANA 1: Sugeruję czarne tło dla gry w kosmosie
    backgroundColor: '#000000', 

    // ZMIANA 2: Dodanie bloku fizyki (KLUCZOWE!)
    physics: {
        default: 'arcade', // Używamy fizyki Arcade
        arcade: {
            gravity: { x: 0, y: 0 }, // Nasza gra nie ma grawitacji!
            debug: false        // Ustaw na 'true' aby widzieć hitboxy
        }
    },

    // Twoja struktura scen jest idealna
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver
    ]
};

export function StartGame(parent: string)  {
    return new Game({ ...config, parent });
}

export default StartGame;
