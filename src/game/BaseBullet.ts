import { Physics, Scene } from 'phaser'
import { getGameHeight } from './helpers/gameHelpers'

export abstract class BaseBullet extends Physics.Arcade.Sprite {
    protected direction: 'up' | 'down'
    protected defaultVelocity: number

    constructor(
        scene: Scene, 
        x: number, 
        y: number, direction: 'up' | 'down', defaultVelocity: number, texture: string) {
        super(scene, x, y, texture)
        this.direction = direction
        this.defaultVelocity = defaultVelocity
    }

    fire(x: number, y: number, velocityY?: number) {
        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)

        this.body!.reset(x, y)

        this.setVelocityY(velocityY ?? this.defaultVelocity)

        this.setActive(true)
        this.setVisible(true)
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta)

        if (this.direction === 'up' && this.y <= 0) {
            this.destroyBullet()
        } else if (this.direction === 'down') {
            const gameHeight = getGameHeight(this.scene)
            if (this.y >= gameHeight) this.destroyBullet()
        }
    }

    destroyBullet() {
        this.setActive(false)
        this.setVisible(false)
        this.destroy()
    }
}
