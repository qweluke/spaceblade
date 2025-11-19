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
    private score: number = 0
    private playerLives: number = 0
    private enemiesLeftInGame: number = 0
    private escKey!: Phaser.Input.Keyboard.Key

    // Czas poziomu
    private levelTime: number = 0

    constructor() {
        super('GameScene')
    }

    init(data: { levelIndex?: number }) {
        this.levelManager = new LevelManager()
        // Ustawiamy poziom startowy (domyślnie 0)
        const startIndex = data.levelIndex || 0
        this.levelManager.setLevel(startIndex)

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
        this.uiManager = new UIManager(this)
        this.formationManager = new FormationManager(this)
        this.collisionManager = new CollisionManager(this)
        this.playerManager = new PlayerManager(this) // Zakładam, że PlayerManager tworzy gracza tutaj

        // Ścieżki
        const gameWidth = this.sys.game.config.width as number
        const gameHeight = this.sys.game.config.height as number
        this.paths = createLevelPaths(gameWidth, gameHeight)

        this.enemyManager = new EnemyManager(this, this.formationManager, this.paths)
        this.enemyManager.create() // Tworzy puste grupy enemies i bullets

        this.setupPhysicsWorld()

        // Elementy gry
        this.uiManager.createBorders()
        this.uiManager.createStars()
        this.uiManager.createHUD(this.score, this.playerLives)
        this.formationManager.createSlots()
        
        this.playerManager.create() 
        this.enemyManager.setPlayer(this.playerManager.getPlayer())

        // Kolizje - definiujemy je RAZ. Nawet jak wyczyścimy grupy wrogów, te powiązania zostaną.
        this.collisionManager.setup(
            this.playerManager.getPlayerBullets(),
            this.enemyManager.getEnemies(),
            this.enemyManager.getEnemyBullets(),
            this.playerManager.getPlayer(),
            () => this.onPlayerHit()
        )

        this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
        this.escKey.on('down', () => this.pauseGame())

        // Start pierwszego poziomu
        this.startLevel()
    }

    update(time: number, delta: number) {
        if (!this.playerManager.getPlayer().active) {
            return
        }

        this.levelTime += delta

        this.playerManager.update(this.levelTime)
        this.formationManager.updateSway(this.levelTime, this.enemyManager.getEnemies())
        this.uiManager.animate()
    }

    private setupPhysicsWorld(): void {
        const borderWidth = GameConstants.BORDER_WIDTH
        const gameWidth = this.sys.game.config.width as number
        const gameHeight = this.sys.game.config.height as number
        this.physics.world.setBounds(borderWidth, 0, gameWidth - borderWidth * 2, gameHeight)
    }

    private startLevel(): void {
        // Pobieramy dane dla AKTUALNEGO poziomu (indeks jest ustawiony w managerze)
        const levelData = this.levelManager.getCurrentLevel()
        if (!levelData) {
            console.error('Błąd: Brak danych poziomu!')
            return
        }

        console.log(`--- START LEVEL ${levelData.level} ---`)
        
        // Resetujemy stan rozgrywki dla poziomu
        this.enemiesLeftInGame = 0
        this.formationManager.reset() // Czyści sloty formacji

        // Spawnowanie
        if (levelData.type === 'wave') {
            levelData.waves.forEach((wave) => {
                this.enemiesLeftInGame += wave.count
                this.enemyManager.spawnWave(
                    wave,
                    () => {}, 
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
        this.registry.set('lives', this.playerLives)

        if (this.playerLives <= 0) {
            this.gameOver()
        }
    }

    private onEnemyKilled(points: number): void {
        this.score += points
        this.registry.set('score', this.score)
        
        this.enemiesLeftInGame--
        this.formationManager.freeSlot()
        this.checkLevelComplete()
    }

    private checkLevelComplete(): void {
        if (this.enemiesLeftInGame === 0) {
            this.startNextLevelSequence()
        }
    }

    // Sekwencja przejścia (napisy, czekanie)
    private startNextLevelSequence(): void {
        this.enemyManager.stopAttackTimer()
        this.uiManager.showLevelCompleteText()

        this.time.delayedCall(GameConstants.LEVEL_COMPLETE_DELAY, () => {
            if (this.levelManager.hasNextLevel()) {
                // === SOFT TRANSITION ===
                // Zamiast restart(), wywołujemy naszą nową metodę
                this.transitionToNextLevel()
            } else {
                this.uiManager.showCongratulationsText()
                // Tutaj można dodać np. this.scene.start('MainMenu') po chwili
            }
        })
    }

    // === TO JEST NOWA METODA ZASTĘPUJĄCA RESTART ===
    private transitionToNextLevel(): void {
        // this.uiManager.hideLevelCompleteText()
        // 1. Sprzątanie (Ważne: EnemyManager musi mieć metodę clear!)
        this.enemyManager.clear()

        this.playerManager.resetShootingState()
        
        // Ukryj napisy "Level Complete" (jeśli UIManager nie ma takiej metody, warto dodać, lub zniszczyć tekst ręcznie)
        // this.uiManager.hideLevelCompleteText() 
        // Alternatywnie, jeśli tekst znika sam lub jest niszczony przy tworzeniu nowego, to ok.
        // Ale w podejściu bez restartu, obiekty UI zostają! Musisz je ukryć/zresetować.
        
        // 2. Aktualizacja Level Managera
        const nextIndex = this.levelManager.getNextLevelIndex()
        this.levelManager.setLevel(nextIndex)

        // 3. Reset czasu poziomu
        this.levelTime = 0

        // 4. Opcjonalnie: Reset pozycji gracza (żeby startował od dołu/środka)
        // this.playerManager.resetPosition() 

        // 5. Start nowego poziomu
        this.startLevel()
    }

    private gameOver(): void {
        this.scene.launch('GameOver')
    }

    private pauseGame(): void {
        if (!this.playerManager.getPlayer().active) return
        if (this.scene.isPaused()) return
        this.scene.launch('PauseScene')
    }

    changeScene() {
        this.scene.start('GameOver')
    }
}