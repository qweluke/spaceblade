import * as Phaser from 'phaser'
import { Enemy } from '../Enemy'
import { GameBoss, GameWave } from '../types'
import { FormationController } from './FormationController'
import { GameConstants } from '../gameConstants'
import { EnemyBullet } from '../EnemyBullet'

export class EnemyController {
    private scene: Phaser.Scene
    private enemies!: Phaser.Physics.Arcade.Group
    private enemyBullets!: Phaser.Physics.Arcade.Group
    private formationManager: FormationController
    private paths: Map<string, Phaser.Curves.Path>
    private attackTimer!: Phaser.Time.TimerEvent
    private shootTimer!: Phaser.Time.TimerEvent
    private player!: Phaser.Physics.Arcade.Sprite

    constructor(scene: Phaser.Scene, formationManager: FormationController, paths: Map<string, Phaser.Curves.Path>) {
        this.scene = scene
        this.formationManager = formationManager
        this.paths = paths

        this.create()
    }

    create(): void {
        this.enemyBullets = this.scene.physics.add.group({
            classType: EnemyBullet,
            runChildUpdate: true,
            maxSize: 20, // Maximum number of enemy bullets on screen
        })

        this.enemies = this.scene.physics.add.group({
            classType: Enemy,
            runChildUpdate: true,
        })
    }

    setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
        this.player = player
    }

    spawnWave(waveConfig: GameWave, onArrival: (enemy: Enemy) => void, onKilled: (enemy: Enemy) => void): void {
        const path = this.paths.get(waveConfig.pathKey)
        if (!path) {
            console.warn(`Path not found: ${waveConfig.pathKey}`)
            return
        }

        for (let i = 0; i < waveConfig.count; i++) {
            const enemy = this.enemies.get(0, 0, waveConfig.enemyType) as Enemy | null
            if (!enemy) {
                console.warn(`Failed to spawn enemy: ${waveConfig.enemyType}`)
                continue
            }

            enemy.setType('wave')
            enemy
                .setActive(true)
                .setVisible(true)
                .setStats(waveConfig.health, waveConfig.points)
                .followPath(path, waveConfig.duration, i * waveConfig.delay)

            enemy.removeAllListeners('pathComplete')
            enemy.removeAllListeners('enemyKilled')

            enemy.once('pathComplete', () => {
                this.onEnemyArrival(enemy, onArrival)
            })
            enemy.once('enemyKilled', (enemy: Enemy) => onKilled( enemy))
            enemy.on('enemyAttacking', (enemy: Enemy) => {
                // Enemy shoots when starting an attack run
                this.shootBullet(enemy)
            })
        }
    }

    spawnBoss(bossConfig: GameBoss, onKilled: (enemy: Enemy) => void): void {
        const path = this.paths.get(bossConfig.pathKey)
        if (!path) {
            console.warn(`Path not found: ${bossConfig.pathKey}`)
            return
        }

        const boss = this.enemies.get(0, 0, bossConfig.enemyType) as Enemy | null
        if (!boss) {
            console.warn(`Failed to spawn boss: ${bossConfig.enemyType}`)
            return
        }

        boss.setType('boss')
        boss.setActive(true).setVisible(true)
        boss.setStats(bossConfig.health, bossConfig.points)
        boss.setScale(2.5)

        boss.followPath(path, bossConfig.duration, 0)

        boss.removeAllListeners('pathComplete')
        boss.removeAllListeners('enemyKilled')

        boss.once('pathComplete', (bossEnemy: Enemy) => {
            const endOfPath = path.getEndPoint()
            bossEnemy.formationSlot.set(endOfPath.x, endOfPath.y)
            bossEnemy.currentState = 'inFormation'
            bossEnemy.setRotation(0)
            bossEnemy.emit('inFormation', bossEnemy)
        })

        boss.once('enemyKilled', (enemy: Enemy) => onKilled(enemy))
        boss.on('enemyAttacking', (enemy: Enemy) => {
            // Boss shoots when starting an attack run
            this.shootBullet(enemy)
        })
    }

    private onEnemyArrival(enemy: Enemy, onArrival: (enemy: Enemy) => void): void {
        const slotIndex = this.formationManager.findNextAvailableSlot()
        if (slotIndex === null) {
            console.warn('No available formation slots!')
            return
        }

        const targetPos = this.formationManager.getSlotPosition(slotIndex)
        this.formationManager.occupySlot(slotIndex)
        enemy.formationSlotIndex = slotIndex

        enemy.moveToFormation(targetPos.x, targetPos.y, GameConstants.FORMATION_MOVE_DURATION)

        enemy.removeAllListeners('inFormation')
        enemy.once('inFormation', () => {
            onArrival(enemy)
        })
    }

    startAttackTimer(): void {
        if (this.attackTimer) this.attackTimer.remove()

        this.attackTimer = this.scene.time.addEvent({
            delay: GameConstants.ATTACK_TIMER_DELAY,
            callback: this.triggerEnemyAttack,
            callbackScope: this,
            loop: true,
        })
    }

    stopAttackTimer(): void {
        if (this.attackTimer) {
            this.attackTimer.remove()
        }
    }

    startShootTimer(): void {
        if (this.shootTimer) {
            this.shootTimer.remove()
        }

        this.shootTimer = this.scene.time.addEvent({
            delay: GameConstants.ENEMY_SHOOT_TIMER_DELAY,
            callback: this.triggerEnemyShoot,
            callbackScope: this,
            loop: true,
        })
    }

    stopShootTimer(): void {
        if (this.shootTimer) {
            this.shootTimer.remove()
        }
    }

    private triggerEnemyAttack(): void {
        const availableEnemies = this.enemies.getChildren().filter((e) => {
            const enemy = e as Enemy
            return enemy.isInFormation && enemy.type !== 'boss' && enemy.active
        })

        if (availableEnemies.length > 0) {
            const attacker = Phaser.Utils.Array.GetRandom(availableEnemies) as Enemy
            attacker.startAttackRun(this.player)
        }
    }

    private triggerEnemyShoot(): void {
        const availableEnemies = this.enemies.getChildren().filter((e) => {
            const enemy = e as Enemy
            return enemy.isInFormation && enemy.active
        })

        if (availableEnemies.length > 0) {
            // Random chance to shoot (30% chance per timer tick)
            if (Math.random() < 0.3) {
                const shooter = Phaser.Utils.Array.GetRandom(availableEnemies) as Enemy
                this.shootBullet(shooter)
            }
        }
    }

    shootBullet(enemy: Enemy): void {
        const bullet = this.enemyBullets.get() as EnemyBullet | null
        if (!bullet) {
            // No available bullets in pool
            return
        }

        bullet.fire(enemy.x, enemy.y + GameConstants.ENEMY_BULLET_OFFSET_Y, GameConstants.ENEMY_BULLET_SPEED)
    }

    getEnemies(): Phaser.Physics.Arcade.Group {
        return this.enemies
    }

    getEnemyBullets(): Phaser.Physics.Arcade.Group {
        return this.enemyBullets
    }

    // Dodaj tę metodę na końcu klasy EnemyManager (przed klamrą zamykającą)
    clear(): void {
        // 1. Zatrzymaj timery
        this.stopAttackTimer()
        this.stopShootTimer()

        // 2. Wyczyść grupy fizyczne
        // clear(true, true) oznacza: usuń ze sceny (removeFromScene) i zniszcz obiekt (destroyChild)
        this.enemies.clear(true, true)
        this.enemyBullets.clear(true, true)
    }
}
