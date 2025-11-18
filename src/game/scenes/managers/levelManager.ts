import { GameLevel } from '../../types'
import { levels } from '../../levels'

export class LevelManager {
    private currentLevelIndex: number = 0

    getCurrentLevel(): GameLevel | null {
        if (this.currentLevelIndex < 0 || this.currentLevelIndex >= levels.length) {
            return null
        }
        return levels[this.currentLevelIndex]
    }

    setLevel(index: number): void {
        this.currentLevelIndex = index
    }

    getLevelIndex(): number {
        return this.currentLevelIndex
    }

    hasNextLevel(): boolean {
        return this.currentLevelIndex + 1 < levels.length
    }

    getNextLevelIndex(): number {
        return this.currentLevelIndex + 1
    }

    isLastLevel(): boolean {
        return this.currentLevelIndex === levels.length - 1
    }
}
