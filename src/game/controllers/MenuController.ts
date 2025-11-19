import { Scene, GameObjects } from 'phaser'

type ButtonStyle = Phaser.Types.GameObjects.Text.TextStyle

export type MenuItem = {
    button: GameObjects.Text
    handler: () => void
}

type MenuControllerConfig = {
    scene: Scene
    menuItems: MenuItem[]
    defaultStyle: ButtonStyle
    selectedStyle: ButtonStyle
}

export class MenuController {
    private scene: Scene
    private menuItems: MenuItem[]
    private selectedIndex: number = 0
    private defaultStyle: ButtonStyle
    private selectedStyle: ButtonStyle

    constructor(config: MenuControllerConfig) {
        this.scene = config.scene
        this.menuItems = config.menuItems
        this.defaultStyle = config.defaultStyle
        this.selectedStyle = config.selectedStyle

        this.init()
    }

    private init() {
        // 1. Klawiatura
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.on('keydown-UP', () => this.changeSelection(-1))
            this.scene.input.keyboard.on('keydown-DOWN', () => this.changeSelection(1))
            this.scene.input.keyboard.on('keydown-ENTER', () => this.confirmSelection())
        }

        // 2. Myszka (teraz iterujemy po menuItems)
        this.menuItems.forEach((item, index) => {
            const btn = item.button

            btn.setInteractive({ useHandCursor: true })

            btn.on('pointerover', () => this.selectButton(index))

            btn.on('pointerdown', () => {
                this.selectButton(index)
                this.confirmSelection()
            })
        })

        this.scene.events.once('shutdown', () => this.cleanup())
        this.selectButton(0)
    }

    private changeSelection(direction: number) {
        let newIndex = this.selectedIndex + direction

        if (newIndex < 0) {
            newIndex = this.menuItems.length - 1
        } else if (newIndex >= this.menuItems.length) {
            newIndex = 0
        }

        this.selectButton(newIndex)
    }

    private selectButton(index: number) {
        this.selectedIndex = index
        // Reset stylów dla wszystkich
        this.menuItems.forEach((item) => item.button.setStyle(this.defaultStyle))

        const activeItem = this.menuItems[this.selectedIndex]
        if (activeItem) activeItem.button.setStyle(this.selectedStyle)
    }

    private confirmSelection() {
        const activeItem = this.menuItems[this.selectedIndex]
        if (activeItem && activeItem.handler) {
            activeItem.handler()
        }
    }

    private cleanup() {
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.off('keydown-UP')
            this.scene.input.keyboard.off('keydown-DOWN')
            this.scene.input.keyboard.off('keydown-ENTER')
        }
    }
}
