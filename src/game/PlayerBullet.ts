import { Scene } from 'phaser'
import { BaseBullet } from './BaseBullet'

export class PlayerBullet extends BaseBullet {
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'up', -500, 'bulletTexture')
    }
}
