import * as Phaser from 'phaser'
import { createLevelPaths } from '../helpers/createLevelPaths'
import { GameConstants } from './managers/gameConstants'
import { UIManager } from './managers/UIManager'
import { PlayerManager } from './managers/playerManager'
import { EnemyManager } from './managers/enemyManager'
import { FormationManager } from './managers/formationManager'
import { CollisionManager } from './managers/collisionManager'
import { LevelManager } from './managers/levelManager'

export class GameScene extends Phaser.Scene {
    // Managers
    private uiManager!: UIManager
    private playerManager!: PlayerManager
    private enemyManager!: EnemyManager
    private formationManager!: FormationManager
    private collisionManager!: CollisionManager
    private levelManager!: LevelManager

    // Game State
    private paths!: Map<string, Phaser.Curves.Path>
    private score: number = GameConstants.INITIAL_SCORE
    private playerLives: number = GameConstants.INITIAL_LIVES
    private enemiesLeftInGame: number = 0
    private escKey!: Phaser.Input.Keyboard.Key

    constructor() {
        super('GameScene')
    }

    init(data: { levelIndex?: number }) {
        this.levelManager = new LevelManager()
        this.levelManager.setLevel(data.levelIndex || 0)
        this.score = GameConstants.INITIAL_SCORE
        this.playerLives = GameConstants.INITIAL_LIVES
    }

    preload() {
        this.load.setPath('assets')
        this.load.image('playerTexture', 'player1.png')
        this.load.image('borderTexture', 'border.png')
        this.load.image('bulletTexture', 'bullet.png')
        this.load.image('starsATexture', 'stars-A.png')
        this.load.image('starsBTexture', 'stars-B.png')
        this.load.image('enemy_blue', 'enemy1.png')
        this.load.image('enemy_green', 'enemy2.png')
        this.load.image('boss_mothership', 'mothership.png')
        this.load.audio('shootSound', 'alienshoot1.wav')
    }

    create() {
        // Initialize managers
        this.uiManager = new UIManager(this)
        this.formationManager = new FormationManager(this)
        this.collisionManager = new CollisionManager(this)
        this.playerManager = new PlayerManager(this)

        // Create paths
        const gameWidth = this.sys.game.config.width as number
        const gameHeight = this.sys.game.config.height as number
        this.paths = createLevelPaths(gameWidth, gameHeight)

        // Initialize enemy manager with dependencies
        this.enemyManager = new EnemyManager(this, this.formationManager, this.paths)

        // Setup physics
        this.setupPhysicsWorld()

        // Create game objects
        this.uiManager.createBorders()
        this.uiManager.createStars()
        this.uiManager.createHUD(this.score, this.playerLives)
        this.formationManager.createSlots()
        this.playerManager.create()
        this.enemyManager.create()
        this.enemyManager.setPlayer(this.playerManager.getPlayer())

        // Setup collisions
        this.collisionManager.setup(
            this.playerManager.getPlayerBullets(),
            this.enemyManager.getEnemies(),
            this.enemyManager.getEnemyBullets(),
            this.playerManager.getPlayer(),
            () => this.onPlayerHit()
        )

        // Setup pause with ESC key
        this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        this.escKey.on('down', () => this.pauseGame())

        // Start level
        this.startLevel()
    }

    update(time: number, _delta: number) {
        if (!this.playerManager.getPlayer().active) {
            return
        }

        this.playerManager.update(time)
        this.formationManager.updateSway(time, this.enemyManager.getEnemies())
        this.uiManager.animate()
    }

    private setupPhysicsWorld(): void {
        const borderWidth = GameConstants.BORDER_WIDTH
        const gameWidth = this.sys.game.config.width as number
        const gameHeight = this.sys.game.config.height as number

        this.physics.world.setBounds(borderWidth, 0, gameWidth - borderWidth * 2, gameHeight)
    }

    private startLevel(): void {
        const levelData = this.levelManager.getCurrentLevel()
        if (!levelData) {
            console.error('Invalid level data!')
            return
        }

        console.log(`Rozpoczynam poziom ${levelData.level}`)
        this.enemiesLeftInGame = 0
        this.formationManager.reset()

        if (levelData.type === 'wave') {
            levelData.waves.forEach((wave) => {
                this.enemiesLeftInGame += wave.count
                this.enemyManager.spawnWave(
                    wave,
                    () => {}, // onArrival - can be handled here if needed
                    (points) => this.onEnemyKilled(points)
                )
            })
        } else if (levelData.type === 'boss') {
            this.enemiesLeftInGame = 1
            this.enemyManager.spawnBoss(levelData.boss, (points) => this.onEnemyKilled(points))
        }

        this.enemyManager.startAttackTimer()
    }

    private onPlayerHit(): void {
        if (!this.playerManager.hit()) return

        this.playerLives--
        this.uiManager.updateLives(this.playerLives)

        if (this.playerLives <= 0) {
            this.gameOver()
        }
    }

    private onEnemyKilled(points: number): void {
        this.score += points
        this.uiManager.updateScore(this.score)
        this.enemiesLeftInGame--
        this.formationManager.freeSlot()
        this.checkLevelComplete()
    }

    private checkLevelComplete(): void {
        if (this.enemiesLeftInGame === 0) {
            const levelData = this.levelManager.getCurrentLevel()
            console.log(`POZIOM ${levelData?.level} UKOŃCZONY!`)
            this.startNextLevel()
        }
    }

    private startNextLevel(): void {
        this.enemyManager.stopAttackTimer()
        this.uiManager.showLevelCompleteText()

        this.time.delayedCall(GameConstants.LEVEL_COMPLETE_DELAY, () => {
            if (this.levelManager.hasNextLevel()) {
                this.scene.restart({
                    levelIndex: this.levelManager.getNextLevelIndex(),
                })
            } else {
                this.uiManager.showCongratulationsText()
                this.scene.pause()
            }
        })
    }

    private gameOver(): void {
        this.scene.launch('GameOver')
    }

    private pauseGame(): void {
        // Don't allow pausing if game is over or player is inactive
        if (!this.playerManager.getPlayer().active) {
            return
        }

        // Don't pause if already paused
        if (this.scene.isPaused()) {
            return
        }

        // Launch PauseScene which will handle pausing this scene
        this.scene.launch('PauseScene')
    }

    changeScene() {
        this.scene.start('GameOver')
    }
}
