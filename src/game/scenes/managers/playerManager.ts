import * as Phaser from 'phaser'
import { PlayerBullet } from '../../PlayerBullet'
import { GameConstants } from './gameConstants'

export class PlayerManager {
    private scene: Phaser.Scene
    private player!: Phaser.Physics.Arcade.Sprite & { isInvincible?: boolean }
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private lastFiredTime: number = 0
    private playerBullets!: Phaser.Physics.Arcade.Group

    constructor(scene: Phaser.Scene) {
        this.scene = scene
    }

    create(): void {
        const gameWidth = this.scene.sys.game.config.width as number
        const gameHeight = this.scene.sys.game.config.height as number

        this.player = this.scene.physics.add.sprite(
            gameWidth / 2,
            gameHeight - GameConstants.PLAYER_START_Y_OFFSET,
            'playerTexture'
        )
        this.player.setCollideWorldBounds(true)
        this.player.isInvincible = false

        this.cursors = this.scene.input.keyboard!.createCursorKeys()

        this.playerBullets = this.scene.physics.add.group({
            classType: PlayerBullet,
            runChildUpdate: true,
            maxSize: 3, // jak duzo pociskow moze byc na ekranie
        })
    }

    update(time: number): void {
        if (!this.player.active) return

        this.handleMovement()
        this.handleShooting(time)
    }

    private handleMovement(): void {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-GameConstants.PLAYER_SPEED)
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(GameConstants.PLAYER_SPEED)
        } else {
            this.player.setVelocityX(0)
        }
    }

    private handleShooting(time: number): void {
        if (this.cursors.space.isDown && time > this.lastFiredTime + GameConstants.FIRE_RATE) {
            this.fireBullet(time)
        }
    }

    private fireBullet(time: number): void {
        this.lastFiredTime = time

        const canFireBullet = this.playerBullets.get() as PlayerBullet | null
        const maxBullets = this.playerBullets.maxSize
        if (!canFireBullet) {
            console.warn('No available bullets in pool - maxSize ' + maxBullets)
            return
        }

        // Play shoot sound
        this.scene.sound.play('shootSound', { volume: 0.5 })

        canFireBullet.fire(this.player.x, this.player.y + GameConstants.BULLET_OFFSET_Y)
    }

    hit(): boolean {
        if (this.player.isInvincible) return false

        this.player.isInvincible = true
        this.scene.tweens.add({
            targets: this.player,
            alpha: 0.5,
            duration: GameConstants.INVINCIBILITY_FLASH_DURATION,
            ease: 'Linear',
            yoyo: true,
            repeat: GameConstants.INVINCIBILITY_FLASH_REPEATS,
            onComplete: () => {
                this.player.setAlpha(1.0)
                this.player.isInvincible = false
            },
        })

        return true
    }

    getPlayer(): Phaser.Physics.Arcade.Sprite {
        return this.player
    }

    getPlayerBullets(): Phaser.Physics.Arcade.Group {
        return this.playerBullets
    }

    deactivate(): void {
        this.player.setActive(false).setVisible(false)
    }
}
