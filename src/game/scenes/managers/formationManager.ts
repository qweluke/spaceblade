import * as Phaser from 'phaser'
import { Enemy } from '../../Enemy'
import { GameConstants } from './gameConstants'

export class FormationManager {
    private scene: Phaser.Scene
    private formationSlots: Phaser.Math.Vector2[] = []
    private nextSlotIndex: number = 0
    private occupiedSlots: Set<number> = new Set()
    private formationSwaySpeed: number = 0.0005
    private formationSwayAmplitude: number = 30
    private formationEnemiesCache: Enemy[] = []

    constructor(scene: Phaser.Scene) {
        this.scene = scene
    }

    createSlots(): void {
        this.formationSlots = []
        const rows = GameConstants.FORMATION_ROWS
        const cols = GameConstants.FORMATION_COLS
        const spacingX = GameConstants.FORMATION_SPACING_X
        const spacingY = GameConstants.FORMATION_SPACING_Y
        const gameWidth = this.scene.sys.game.config.width as number
        const startX = gameWidth / 2 - (spacingX * (cols - 1)) / 2
        const startY = GameConstants.FORMATION_START_Y

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.formationSlots.push(new Phaser.Math.Vector2(startX + c * spacingX, startY + r * spacingY))
            }
        }
    }

    updateSway(time: number, enemies: Phaser.Physics.Arcade.Group): void {
        const offsetX = Math.sin(time * this.formationSwaySpeed) * this.formationSwayAmplitude
        const offsetY = Math.cos(time * this.formationSwaySpeed) * (this.formationSwayAmplitude / 3)

        this.updateFormationCache(enemies)

        this.formationEnemiesCache.forEach((enemy) => {
            if (enemy.active && enemy.isInFormation) {
                enemy.x = enemy.formationSlot.x + offsetX
                enemy.y = enemy.formationSlot.y + offsetY
            }
        })
    }

    findNextAvailableSlot(): number | null {
        if (!this.occupiedSlots.has(this.nextSlotIndex)) {
            return this.nextSlotIndex
        }

        for (let i = 0; i < this.formationSlots.length; i++) {
            const index = (this.nextSlotIndex + i) % this.formationSlots.length
            if (!this.occupiedSlots.has(index)) {
                return index
            }
        }

        return null
    }

    occupySlot(slotIndex: number): void {
        this.occupiedSlots.add(slotIndex)
        this.nextSlotIndex = (slotIndex + 1) % this.formationSlots.length
    }

    freeSlot(): void {
        if (this.occupiedSlots.size > 0) {
            const firstSlot = this.occupiedSlots.values().next().value!
            this.occupiedSlots.delete(firstSlot)
        }
    }

    getSlotPosition(slotIndex: number): Phaser.Math.Vector2 {
        return this.formationSlots[slotIndex]
    }

    reset(): void {
        this.nextSlotIndex = 0
        this.occupiedSlots.clear()
    }

    private updateFormationCache(enemies: Phaser.Physics.Arcade.Group): void {
        this.formationEnemiesCache = enemies.getChildren().filter((e) => (e as Enemy).isInFormation) as Enemy[]
    }
}
