import { Scene } from 'phaser'

export class PauseScene extends Scene {
    private pausedText!: Phaser.GameObjects.Text
    private escKey!: Phaser.Input.Keyboard.Key

    constructor() {
        super('PauseScene')
    }

    create() {
        const gameWidth = this.sys.game.config.width as number
        const gameHeight = this.sys.game.config.height as number

        // Create semi-transparent overlay
        const overlay = this.add.rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000, 0.7)
        overlay.setDepth(1000)

        // Create PAUSED text
        this.pausedText = this.add
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

        // Setup ESC key to resume
        this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        this.escKey.on('down', () => this.resumeGame())

        // Pause the GameScene
        const gameScene = this.scene.get('GameScene')
        if (gameScene && gameScene.scene.isActive()) {
            gameScene.scene.pause()
        }
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
