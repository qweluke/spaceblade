import * as Phaser from 'phaser'
import { GameConstants } from './gameConstants'

export class UIManager {
    private scene: Phaser.Scene
    private leftBorder!: Phaser.GameObjects.TileSprite
    private rightBorder!: Phaser.GameObjects.TileSprite
    private starsA!: Phaser.GameObjects.TileSprite
    private starsB!: Phaser.GameObjects.TileSprite
    private scoreText!: Phaser.GameObjects.Text
    private livesText!: Phaser.GameObjects.Text

    constructor(scene: Phaser.Scene) {
        this.scene = scene
    }

    createBorders(): void {
        const gameWidth = this.scene.sys.game.config.width as number
        const gameHeight = this.scene.sys.game.config.height as number
        const borderWidth = GameConstants.BORDER_WIDTH

        this.leftBorder = this.scene.add
            .tileSprite(borderWidth / 2, gameHeight / 2, borderWidth, gameHeight, 'borderTexture')
            .setDepth(2) // keep above stars

        this.rightBorder = this.scene.add
            .tileSprite(gameWidth - borderWidth / 2, gameHeight / 2, borderWidth, gameHeight, 'borderTexture')
            .setDepth(2) // keep above stars
        this.rightBorder.setFlipX(true)
    }

    createStars(): void {
        const gameWidth = this.scene.sys.game.config.width as number
        const gameHeight = this.scene.sys.game.config.height as number

        // Make starsA and starsB start at (0,0) and cover full game width and height
        this.starsA = this.scene.add.tileSprite(0, 0, gameWidth, gameHeight, 'starsATexture').setOrigin(0, 0)
        this.starsB = this.scene.add.tileSprite(0, 0, gameWidth, gameHeight, 'starsBTexture').setOrigin(0, 0)
    }

    private animateBorders(): void {
        this.leftBorder.tilePositionY -= GameConstants.BORDER_SCROLL_SPEED
        this.rightBorder.tilePositionY -= GameConstants.BORDER_SCROLL_SPEED
    }

    private animateStars(): void {
        // Give nice parallax effect to the starsA and starsB tileSprites
        // We'll scroll starsA slowly, and starsB faster for a layered effect.
        if (this.starsA) {
            this.starsA.tilePositionY -= GameConstants.STARS_SCROLL_SPEED_A || 0.15
        }
        if (this.starsB) {
            this.starsB.tilePositionY -= GameConstants.STARS_SCROLL_SPEED_B || 0.35
        }
    }

    animate(): void {
        this.animateBorders()
        this.animateStars()
    }

    createHUD(initialScore: number, initialLives: number): void {
        const padding = GameConstants.HUD_PADDING
        const fontSize = GameConstants.HUD_FONT_SIZE
        const color = GameConstants.HUD_COLOR
        const gameWidth = this.scene.sys.game.config.width as number

        this.scoreText = this.scene.add.text(padding, padding, `Score: ${this.formatScore(initialScore)}`, {
            fontSize,
            color,
        })
        .setDepth(1002)

        this.livesText = this.scene.add
            .text(gameWidth - padding, padding, `Lives: ${initialLives}`, { fontSize, color })
            .setOrigin(1, 0)
            .setDepth(1002)
    }

    updateScore(score: number): void {
        this.scoreText.setText(`Score: ${this.formatScore(score)}`)
    }

    updateLives(lives: number): void {
        this.livesText.setText(`Lives: ${lives}`)
    }

    showGameOverText(): Phaser.GameObjects.Text {
        return this.createCenteredText(this.getCenterX(), this.getCenterY(), 'GAME OVER', {
            fontSize: '64px',
            color: '#ff0000',
        })
    }

    showLevelCompleteText(): Phaser.GameObjects.Text {
        return this.createCenteredText(this.getCenterX(), this.getCenterY(), 'LEVEL CLEAR!', {
            fontSize: '48px',
            color: '#00ff00',
        })
    }

    showCongratulationsText(): Phaser.GameObjects.Text {
        return this.createCenteredText(this.getCenterX(), this.getCenterY() + 60, 'GRATULACJE!', {
            fontSize: '48px',
            color: '#ffff00',
        })
    }

    private createCenteredText(
        x: number,
        y: number,
        text: string,
        style: Phaser.Types.GameObjects.Text.TextStyle
    ): Phaser.GameObjects.Text {
        return this.scene.add.text(x, y, text, style).setOrigin(0.5)
    }

    private formatScore(score: number): string {
        return score.toLocaleString()
    }

    private getGameWidth(): number {
        return this.scene.sys.game.config.width as number
    }

    private getGameHeight(): number {
        return this.scene.sys.game.config.height as number
    }

    private getCenterX(): number {
        return this.getGameWidth() / 2
    }

    private getCenterY(): number {
        return this.getGameHeight() / 2
    }
}
