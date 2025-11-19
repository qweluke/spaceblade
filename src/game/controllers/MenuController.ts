import { Scene, GameObjects } from 'phaser'

type ButtonStyle = Phaser.Types.GameObjects.Text.TextStyle

interface MenuControllerConfig {
    scene: Scene
    buttons: GameObjects.Text[]
    defaultStyle: ButtonStyle
    selectedStyle: ButtonStyle
    onConfirm: (selectedIndex: number) => void // Co ma się stać po wciśnięciu Enter
}

export class MenuController {
    private scene: Scene
    private buttons: GameObjects.Text[]
    private selectedIndex: number = 0
    private defaultStyle: ButtonStyle
    private selectedStyle: ButtonStyle
    private onConfirm: (index: number) => void

    constructor(config: MenuControllerConfig) {
        this.scene = config.scene
        this.buttons = config.buttons
        this.defaultStyle = config.defaultStyle
        this.selectedStyle = config.selectedStyle
        this.onConfirm = config.onConfirm

        this.init()
    }

    private init() {
        // 1. Obsługa klawiatury
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.on('keydown-UP', () => this.changeSelection(-1))
            this.scene.input.keyboard.on('keydown-DOWN', () => this.changeSelection(1))
            this.scene.input.keyboard.on('keydown-ENTER', () => this.confirmSelection())
        }

        // 2. Obsługa myszki dla każdego przycisku
        this.buttons.forEach((btn, index) => {
            btn.setInteractive({ useHandCursor: true })

            btn.on('pointerover', () => this.selectButton(index))

            btn.on('pointerdown', () => {
                this.selectButton(index)
                this.confirmSelection()
            })
        })

        // 3. Automatyczne sprzątanie (rozwiązuje problem "Zombie"!)
        this.scene.events.once('shutdown', () => this.cleanup())

        // 4. Wybierz pierwszy element na start
        this.selectButton(0)
    }

    private changeSelection(direction: number) {
        let newIndex = this.selectedIndex + direction

        if (newIndex < 0) {
            newIndex = this.buttons.length - 1
        } else if (newIndex >= this.buttons.length) {
            newIndex = 0
        }

        this.selectButton(newIndex)
    }

    private selectButton(index: number) {
        this.selectedIndex = index

        // Reset stylów dla wszystkich
        this.buttons.forEach((btn) => btn.setStyle(this.defaultStyle))

        // Ustawienie stylu dla wybranego
        const activeBtn = this.buttons[this.selectedIndex]
        if (activeBtn) activeBtn.setStyle(this.selectedStyle)
    }

    private confirmSelection() {
        // Wywołujemy callback przekazany w konfiguracji
        this.onConfirm(this.selectedIndex)
    }

    private cleanup() {
        // Odpinamy eventy klawiatury, żeby nie działały po wyjściu ze sceny
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.off('keydown-UP')
            this.scene.input.keyboard.off('keydown-DOWN')
            this.scene.input.keyboard.off('keydown-ENTER')
        }
    }
}
