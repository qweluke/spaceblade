import { GameObjects, Scene } from 'phaser'
import { EventBus } from '../EventBus'
import { MenuController } from '../controllers/MenuController'

export class MainMenu extends Scene {
    background: GameObjects.Image
    logo: GameObjects.Image
    title: GameObjects.Text

    logoTween: Phaser.Tweens.Tween | null

    constructor() {
        super('MainMenu')
    }

    create() {

        const gameWidth = this.sys.game.config.width as number
        const gameHeight = this.sys.game.config.height as number

        this.background = this.add.image(512, 384, 'background')
        this.logo = this.add.image(512, 300, 'logo').setDepth(100)

        this.title = this.add
            .text(gameWidth / 2, gameHeight / 2 + 20, 'Main Menu', {
                fontFamily: 'Arial Black',
                fontSize: 38,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 8,
                align: 'center',
            })
            .setOrigin(0.5)
            .setDepth(100)

        // Tworzymy przyciski (tylko wygląd, bez logiki interakcji!)
        const startButton = this.add
            .text(gameWidth / 2, gameHeight / 2 + 100, 'Start Game', {
                fontFamily: 'Arial Black',
                fontSize: 32,
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center',
            })
            .setOrigin(0.5)
            .setDepth(100)

        const optionsButton = this.add
            .text(gameWidth / 2, gameHeight / 2 + 150, 'Options', {
                fontFamily: 'Arial Black',
                fontSize: 32,
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 6,
                align: 'center',
            })
            .setOrigin(0.5)
            .setDepth(100)

        // === TUTAJ DZIEJE SIĘ MAGIA ===
        // Delegujemy obsługę menu do naszego kontrolera
        new MenuController({
            scene: this,
            buttons: [startButton, optionsButton],
            defaultStyle: { color: '#00ff00' },
            selectedStyle: { color: '#ffff00' },
            onConfirm: (index) => {
                if (index === 0) this.startGame()
                if (index === 1) console.log('Options...')
            },
        })

        EventBus.emit('current-scene-ready', this)
    }

    startGame() {
        this.scene.start('GameScene')
    }

    // ... reszta kodu (moveLogo) bez zmian ...
    moveLogo(vueCallback: ({ x, y }: { x: number; y: number }) => void) {
        if (this.logoTween) {
            if (this.logoTween.isPlaying()) this.logoTween.pause()
            else this.logoTween.play()
        } else {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (vueCallback) {
                        vueCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y),
                        })
                    }
                },
            })
        }
    }
}
