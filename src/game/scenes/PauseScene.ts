import { Scene } from 'phaser'
import { MenuController } from '../controllers/MenuController'

export class PauseScene extends Scene {
    constructor() {
        super('PauseScene')
    }

    create() {
        const gameWidth = this.sys.game.config.width as number
        const gameHeight = this.sys.game.config.height as number

        const overlay = this.add.rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight, 0x000000, 0.7)
        overlay.setDepth(1000)

        // Create PAUSED text
        const resumeButton = this.add
            .text(gameWidth / 2, gameHeight / 2 + 100, 'Resume', {
                fontFamily: 'Arial Black',
                fontSize: 32,
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center',
            })
            .setOrigin(0.5)
            .setDepth(1001)

        const restartButton = this.add
            .text(gameWidth / 2, gameHeight / 2 + 150, 'Restart', {
                fontFamily: 'Arial Black',
                fontSize: 32,
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center',
            })
            .setOrigin(0.5)
            .setDepth(1001)

        const quitButton = this.add
            .text(gameWidth / 2, gameHeight / 2 + 200, 'Quit', {
                fontFamily: 'Arial Black',
                fontSize: 32,
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center',
            })
            .setOrigin(0.5)
            .setDepth(1001)

        // === UŻYCIE KONTROLERA ===
        new MenuController({
            scene: this,
            buttons: [resumeButton, restartButton, quitButton],
            defaultStyle: { color: '#00ff00' },
            selectedStyle: { color: '#ffff00' },
            onConfirm: (index) => {
                if (index === 0) this.resumeGame()
                if (index === 1) this.restartGame()
                if (index === 2) this.quitGame()
            },
        })

        // Pause the GameScene logic
        const gameScene = this.scene.get('GameScene')
        if (gameScene && gameScene.scene.isActive()) {
            gameScene.scene.pause()
        }
    }

    private restartGame(): void {
        // Musimy też wznowić GameScene, żeby nie była "paused" po restarcie
        const gameScene = this.scene.get('GameScene')
        if (gameScene) {
            gameScene.scene.resume()
        }
        this.scene.start('GameScene', { levelIndex: 0 })
    }

    private quitGame(): void {
        const gameScene = this.scene.get('GameScene')
        if (gameScene) {
            // Ważne: Czyścimy i zatrzymujemy GameScene przed wyjściem
            if (gameScene.children) {
                // Opcjonalnie:  -> Phaser zrobi to przy stop(), ale można dla pewności
                // gameScene.children.removeAll(true)
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
