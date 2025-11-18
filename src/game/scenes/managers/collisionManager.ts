import * as Phaser from 'phaser'
import { PlayerBullet } from '../../PlayerBullet'
import { Enemy } from '../../Enemy'
import { GameConstants } from './gameConstants'

export class CollisionManager {
    private scene: Phaser.Scene

    constructor(scene: Phaser.Scene) {
        this.scene = scene
    }

    setup(
        playerBullets: Phaser.Physics.Arcade.Group,
        enemies: Phaser.Physics.Arcade.Group,
        enemyBullets: Phaser.Physics.Arcade.Group,
        player: Phaser.Physics.Arcade.Sprite,
        onPlayerHit: () => void
    ): void {
        // Player bullet hits enemy
        this.scene.physics.add.collider(playerBullets, enemies, (bullet, enemy) => {
            ;(bullet as PlayerBullet).destroyBullet()
            ;(enemy as Enemy).takeDamage(GameConstants.PLAYER_BULLET_DAMAGE)
        })

        // Enemy bullet hits player
        this.scene.physics.add.collider(enemyBullets, player, (bullet) => {
            ;(bullet as Phaser.Physics.Arcade.Sprite).destroy()
            onPlayerHit()
        })

        // Player collides with enemy
        this.scene.physics.add.overlap(player, enemies, (player, enemy) => {
            onPlayerHit()
            ;(enemy as Enemy).takeDamage(GameConstants.ENEMY_COLLISION_DAMAGE)
        })
    }
}
