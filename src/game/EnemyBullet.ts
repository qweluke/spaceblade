import { Scene } from 'phaser'
import { BaseBullet } from './BaseBullet'

export class EnemyBullet extends BaseBullet {
    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'down', 300, 'enemyBulletTexture')
    }
}

