import { Scene } from 'phaser'

export class PauseScene extends Scene {
    private escKey!: Phaser.Input.Keyboard.Key
    private restartButton: Phaser.GameObjects.Text
    private quitButton: Phaser.GameObjects.Text

    constructor() {
        super('PauseScene')
    }

    create() {
        const gameWidth = this.sys.game.config.width as number
        const gameHeight = this.sys.game.config.height as number

        const overlay = this.add.rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000, 0.7)
        overlay.setDepth(1000)

        // Create PAUSED text
        this.add
            .text(gameWidth / 2, gameHeight / 2, 'PAUSED', {
                fontFamily: 'Arial Black',
                fontSize: '64px',
                color: '#ffff00',
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
            .on('pointerdown', () => this.restartGame())
            .on('pointerover', () => {
                this.restartButton.setStyle({ color: '#ffff00' })
            })
            .on('pointerout', () => {
                this.restartButton.setStyle({ color: '#00ff00' })
            })

        this.quitButton = this.add
            .text(gameWidth / 2, gameHeight / 2 + 150, 'Quit', {
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
            .on('pointerdown', () => this.quitGame())
            .on('pointerover', () => {
                this.quitButton.setStyle({ color: '#ffff00' })
            })
            .on('pointerout', () => {
                this.quitButton.setStyle({ color: '#00ff00' })
            })

        // Setup ESC key to resume
        this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        this.escKey.on('down', () => this.resumeGame())

        // Pause the GameScene
        const gameScene = this.scene.get('GameScene')
        if (gameScene && gameScene.scene.isActive()) {
            gameScene.scene.pause()
        }
    }

    private restartGame(): void {
        this.scene.start('GameScene', { levelIndex: 0 })
    }

    private quitGame(): void {
        const gameScene = this.scene.get('GameScene')
        if (gameScene) {
            if (gameScene.children) {
                gameScene.children.removeAll(true)
            }
            gameScene.scene.stop()
        }
        this.scene.start('MainMenu')
    }

    private resumeGame(): void {
        // Resume the GameScene
        const gameScene = this.scene.get('GameScene')
        if (gameScene && gameScene.scene.isPaused()) {
            gameScene.scene.resume()
        }

        // Stop this scene
        this.scene.stop()
    }
}
