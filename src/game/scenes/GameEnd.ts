import { EventBus } from '../EventBus'
import { Scene } from 'phaser'

export class GameEnd extends Scene {
    gameEndText: Phaser.GameObjects.Text
    restartButton: Phaser.GameObjects.Text

    constructor() {
        super('GameEnd')
    }

    create() {
        const gameWidth = this.sys.game.config.width as number
        const gameHeight = this.sys.game.config.height as number

        // Create semi-transparent overlay
        const overlay = this.add.rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000, 0.7)
        overlay.setDepth(1000)


        this.gameEndText = this.add
            .text(gameWidth / 2, gameHeight / 2, 'Game End', {
                fontFamily: 'Arial Black',
                fontSize: 64,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center',
            })
            .setOrigin(0.5)
            .setDepth(1001)

        this.restartButton = this.add
            .text(gameWidth / 2, gameHeight / 2 + 100, 'Restart', {
                fontFamily: 'Arial Black',
                fontSize: 32,
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center',
            })
            .setOrigin(0.5)
            .setDepth(1001)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.goToMainMenu())
            .on('pointerover', () => {
                this.restartButton.setStyle({ color: '#ffff00' })
            })
            .on('pointerout', () => {
                this.restartButton.setStyle({ color: '#00ff00' })
            })

            const gameScene = this.scene.get('GameScene')
            if (gameScene && gameScene.scene.isActive()) {
                gameScene.scene.pause()
            }
            
        EventBus.emit('current-scene-ready', this)
    }

    private goToMainMenu(): void {
        // Start GameScene from level 1 (levelIndex: 0)
        this.scene.start('MainMenu')
    }

    changeScene() {
        this.scene.start('MainMenu')
    }
}
