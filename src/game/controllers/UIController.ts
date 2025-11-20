import * as Phaser from 'phaser'
import { GameConstants } from '../gameConstants'
import { getGameHeight, getGameWidth } from '../helpers/gameHelpers'
import { GameState } from '../types/GameState'

export class UIController {
    private scene: Phaser.Scene
    private leftBorder!: Phaser.GameObjects.TileSprite
    private rightBorder!: Phaser.GameObjects.TileSprite
    private starsA!: Phaser.GameObjects.TileSprite
    private starsB!: Phaser.GameObjects.TileSprite
    private scoreText!: Phaser.GameObjects.Text
    private livesText!: Phaser.GameObjects.Text
    private levelCompleteText!: Phaser.GameObjects.Text
    private gameOverText!: Phaser.GameObjects.Text

    constructor(scene: Phaser.Scene) {
        this.scene = scene

        const score = this.scene.registry.get('score') || GameConstants.INITIAL_SCORE
        const lives = this.scene.registry.get('lives') || GameConstants.INITIAL_LIVES

        this.createBorders()
        this.createStars()
        this.createHUD(score, lives)
    }

    createBorders(): void {
        const gameWidth = getGameWidth(this.scene)
        const gameHeight = getGameHeight(this.scene)
        const borderWidth = GameConstants.BORDER_WIDTH

        this.leftBorder = this.scene.add
            .tileSprite(borderWidth / 2, gameHeight / 2, borderWidth, gameHeight, 'borderTexture')
            .setDepth(2) // keep above stars
        this.leftBorder.setFlipX(true)

        this.rightBorder = this.scene.add
            .tileSprite(gameWidth - borderWidth / 2, gameHeight / 2, borderWidth, gameHeight, 'borderTexture')
            .setDepth(2) // keep above stars
    }

    createStars(): void {
        const gameWidth = getGameWidth(this.scene)
        const gameHeight = getGameHeight(this.scene)

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
        const gameWidth = getGameWidth(this.scene) as number

        this.scoreText = this.scene.add
            .text(padding, padding, `Score: ${this.formatScore(initialScore)}`, {
                fontSize,
                color,
            })
            .setDepth(1002)

        this.livesText = this.scene.add
            .text(gameWidth - padding, padding, `Lives: ${initialLives}`, { fontSize, color })
            .setOrigin(1, 0)
            .setDepth(1002)

        this.setupListeners()
    }

    private showGameOverText(): void {
        this.gameOverText = this.createCenteredText(this.getCenterX(), this.getCenterY(), 'GAME OVER', {
            fontSize: '64px',
            color: '#ff0000',
        })
    }

    private showLevelCompleteText(): void {
        this.levelCompleteText = this.createCenteredText(this.getCenterX(), this.getCenterY(), 'LEVEL CLEAR!', {
            fontSize: '48px',
            color: '#00ff00',
        })
    }

    private hideLevelCompleteText(): void {
        if (this.levelCompleteText) {
            this.levelCompleteText.destroy()
        }
    }

    private hideGameOverText(): void {
        if (this.gameOverText) {
            this.gameOverText.destroy()
        }
    }

    private showCongratulationsText(): Phaser.GameObjects.Text {
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
        return getGameWidth(this.scene)
    }

    private getGameHeight(): number {
        return getGameHeight(this.scene)
    }

    private getCenterX(): number {
        return this.getGameWidth() / 2
    }

    private getCenterY(): number {
        return this.getGameHeight() / 2
    }

    private setupListeners(): void {
        // 1. Nasłuchujemy na zmianę konkretnego klucza 'lives'
        // Event nazywa się: 'changedata-KLUCZ'
        this.scene.registry.events.on('changedata-lives', this.updateLives, this)

        // 2. Nasłuchujemy na zmianę 'score'
        this.scene.registry.events.on('changedata-score', this.updateScore, this)

        // 3. Sprzątanie przy wyjściu ze sceny (bardzo ważne!)
        this.scene.events.once('shutdown', this.cleanup, this)

        this.scene.registry.events.on('changedata-gameState', this.onGameStateChange, this)
    }

    // Metoda wywoływana automatycznie przez event
    // Phaser przekazuje: (parent, value, previousValue)
    // Nas interesuje tylko 'value'
    private updateLives(_parent: unknown, value: number): void {
        this.livesText.setText(`Lives: ${value}`)
    }

    private updateScore(_parent: unknown, value: number): void {
        this.scoreText.setText(`Score: ${value}`)
    }

    // Metoda czyszcząca
    private cleanup(): void {
        // Musimy odpiąć listenery z registry, bo registry jest GLOBALNE.
        // Jeśli tego nie zrobisz, po restarcie gry stary UIManager (zombie) nadal będzie próbował zmieniać tekst!
        this.scene.registry.events.off('changedata-lives', this.updateLives, this)
        this.scene.registry.events.off('changedata-score', this.updateScore, this)
        this.scene.registry.events.off('changedata-gameState', this.onGameStateChange, this)
    }

    private onGameStateChange(_parent: unknown, newState: GameState) {
        // Ukrywamy wszystko na start (czyszczenie przed nowym stanem)
        this.hideLevelCompleteText()
        this.hideGameOverText()

        switch (newState) {
            case 'LEVEL_COMPLETE':
                this.showLevelCompleteText()
                break
        }
    }
}
