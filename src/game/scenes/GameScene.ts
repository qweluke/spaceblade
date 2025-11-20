import * as Phaser from 'phaser'
import { createLevelPaths } from '../helpers/createLevelPaths'
import { GameConstants } from '../gameConstants'
import { UIController } from '../controllers/UIController'
import { PlayerController } from '../controllers/PlayerController'
import { EnemyController } from '../controllers/EnemyController'
import { FormationController } from '../controllers/FormationController'
import { CollisionController } from '../controllers/CollisionController'
import { LevelController } from '../controllers/LevelController'
import { GameState } from '../types/GameState'

export class GameScene extends Phaser.Scene {
    // Managers
    private uiController!: UIController
    private playerController!: PlayerController
    private enemyController!: EnemyController
    private formationController!: FormationController
    private collisionController!: CollisionController
    private levelController!: LevelController

    // Game State
    private paths!: Map<string, Phaser.Curves.Path>
    private score: number = 0
    private playerLives: number = 0
    private enemiesLeftInGame: number = 0
    private escKey!: Phaser.Input.Keyboard.Key

    // Czas poziomu
    private levelTime: number = 0

    private currentState: GameState = GameState.INTRO

    constructor() {
        super('GameScene')
    }

    init(data: { levelIndex?: number }) {
        this.levelController = new LevelController()
        // Ustawiamy poziom startowy (domyślnie 0)
        const startIndex = data.levelIndex || 0
        this.levelController.setLevel(startIndex)

        this.levelTime = 0

        // Logic Registry - pobieranie lub resetowanie stanu
        if (startIndex === 0) {
            this.score = GameConstants.INITIAL_SCORE
            this.playerLives = GameConstants.INITIAL_LIVES
            this.registry.set('score', this.score)
            this.registry.set('lives', this.playerLives)
        } else {
            this.score = this.registry.get('score') || GameConstants.INITIAL_SCORE
            this.playerLives = this.registry.get('lives') || GameConstants.INITIAL_LIVES
        }
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
        // Inicjalizacja managerów
        this.uiController = new UIController(this)
        this.formationController = new FormationController(this)
        this.collisionController = new CollisionController(this)
        this.playerController = new PlayerController(this) // Zakładam, że PlayerManager tworzy gracza tutaj

        // Ścieżki
        const gameWidth = this.sys.game.config.width as number
        const gameHeight = this.sys.game.config.height as number
        this.paths = createLevelPaths(gameWidth, gameHeight)

        this.enemyController = new EnemyController(this, this.formationController, this.paths)

        this.setupPhysicsWorld()

        // // Elementy gry
        this.playerController.create()
        this.enemyController.setPlayer(this.playerController.getPlayer())

        // Kolizje - definiujemy je RAZ. Nawet jak wyczyścimy grupy wrogów, te powiązania zostaną.
        this.collisionController.setup(
            this.playerController.getPlayerBullets(),
            this.enemyController.getEnemies(),
            this.enemyController.getEnemyBullets(),
            this.playerController.getPlayer(),
            () => this.onPlayerHit()
        )

        this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        this.escKey.on('down', () => this.pauseGame())

        // Start pierwszego poziomu
        this.startLevel()
        this.setState(GameState.PLAYING)
    }

    update(time: number, delta: number) {
        if (!this.playerController.getPlayer().active) {
            return
        }

        this.levelTime += delta

        this.playerController.update(this.levelTime)
        this.formationController.updateSway(this.levelTime, this.enemyController.getEnemies())
        this.uiController.animate()
    }

    private setState(newState: GameState) {
        if (this.currentState === newState) return

        this.currentState = newState

        // 1. Logika logiczna (co się dzieje w silniku gry)
        switch (newState) {
            case GameState.PLAYING:
                this.enemyController.startAttackTimer()
                // Włącz sterowanie gracza
                break

            case GameState.LEVEL_COMPLETE:
                this.enemyController.stopAttackTimer()
                // this.playerManager.setInvincible(true); // Żeby nie zginąć przypadkiem

                this.time.delayedCall(GameConstants.LEVEL_COMPLETE_DELAY, () => {
                    if (!this.levelController.hasNextLevel()) return this.setState(GameState.GAME_END)

                    return this.transitionToNextLevel()
                })
                break

            case GameState.GAME_OVER:
                this.enemyController.stopAttackTimer()
                this.scene.launch('GameOver') // Lub obsługa w UI
                break

            case GameState.GAME_END:
                this.scene.start('GameEnd')
                break
        }

        this.registry.set('gameState', newState)
    }

    private setupPhysicsWorld(): void {
        const borderWidth = GameConstants.BORDER_WIDTH
        const gameWidth = this.sys.game.config.width as number
        const gameHeight = this.sys.game.config.height as number
        this.physics.world.setBounds(borderWidth, 0, gameWidth - borderWidth * 2, gameHeight)
    }

    private startLevel(): void {
        // Pobieramy dane dla AKTUALNEGO poziomu (indeks jest ustawiony w managerze)
        const levelData = this.levelController.getCurrentLevel()
        if (!levelData) {
            console.error('Błąd: Brak danych poziomu!')
            return
        }

        console.log(`--- START LEVEL ${levelData.level} ---`)

        // Resetujemy stan rozgrywki dla poziomu
        this.enemiesLeftInGame = 0
        this.formationController.reset() // Czyści sloty formacji

        // Spawnowanie
        if (levelData.type === 'wave') {
            levelData.waves.forEach((wave) => {
                this.enemiesLeftInGame += wave.count
                this.enemyController.spawnWave(
                    wave,
                    () => {},
                    (points) => this.onEnemyKilled(points)
                )
            })
        } else if (levelData.type === 'boss') {
            this.enemiesLeftInGame = 1
            this.enemyController.spawnBoss(levelData.boss, (points) => this.onEnemyKilled(points))
        }

        this.enemyController.startAttackTimer()
    }

    private onPlayerHit(): void {
        if (!this.playerController.hit()) return

        this.playerLives--
        this.registry.set('lives', this.playerLives)

        if (this.playerLives <= 0) this.setState(GameState.GAME_OVER)
    }

    private onEnemyKilled(points: number): void {
        this.score += points
        this.registry.set('score', this.score)

        this.enemiesLeftInGame--
        this.formationController.freeSlot()
        this.checkLevelComplete()
    }

    private checkLevelComplete(): void {
        if (this.enemiesLeftInGame === 0) {
            this.setState(GameState.LEVEL_COMPLETE)
        }
    }

    private transitionToNextLevel(): void {
        // 1. Sprzątanie (Ważne: EnemyManager musi mieć metodę clear!)
        this.enemyController.clear()

        this.playerController.resetShootingState()

        // Ukryj napisy "Level Complete" (jeśli UIManager nie ma takiej metody, warto dodać, lub zniszczyć tekst ręcznie)
        // this.uiManager.hideLevelCompleteText()
        // Alternatywnie, jeśli tekst znika sam lub jest niszczony przy tworzeniu nowego, to ok.
        // Ale w podejściu bez restartu, obiekty UI zostają! Musisz je ukryć/zresetować.

        // 2. Aktualizacja Level Managera
        const nextIndex = this.levelController.getNextLevelIndex()
        this.levelController.setLevel(nextIndex)

        // 3. Reset czasu poziomu
        this.levelTime = 0

        // 4. Opcjonalnie: Reset pozycji gracza (żeby startował od dołu/środka)
        // this.playerManager.resetPosition()

        // 5. Start nowego poziomu
        this.setState(GameState.PLAYING)
        this.startLevel()
    }

    private pauseGame(): void {
        if (!this.playerController.getPlayer().active) return
        if (this.scene.isPaused()) return
        this.scene.launch('PauseScene')
    }

    changeScene() {
        this.scene.start('GameOver')
    }
}
