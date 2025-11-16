import * as Phaser from "phaser";
import { GameBoss, GameLevel, GameWave } from "../types";
import { levels } from "../levels";
import { PlayerBullet } from "../PlayerBullet";
import { Enemy } from "../Enemy";

export class GameScene extends Phaser.Scene {
    // --- Właściwości Klasy ---

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private playerSpeed: number = 400; // Prędkość gracza w pikselach/sekundę

    // Obiekty Gry
    private player!: Phaser.Physics.Arcade.Sprite & { isInvincible?: boolean }; // Rozszerzamy gracza o flagę
    private enemies!: Phaser.Physics.Arcade.Group;
    private playerBullets!: Phaser.Physics.Arcade.Group;
    private enemyBullets!: Phaser.Physics.Arcade.Group; // Zakładamy, że wrogowie też strzelają

    // Dane Poziomu
    private currentLevelIndex!: number;
    private levelData!: GameLevel;
    private enemiesLeftInGame!: number; // Licznik wszystkich wrogów na poziomie

    // Ścieżki i Formacja
    private paths!: Map<string, Phaser.Curves.Path>;
    private formationSlots: Phaser.Math.Vector2[] = [];
    private nextSlotIndex!: number;

    // Logika "pływania" formacji
    private formationSwaySpeed: number = 0.0005;
    private formationSwayAmplitude: number = 30;

    // UI
    private scoreText!: Phaser.GameObjects.Text;
    private livesText!: Phaser.GameObjects.Text;
    private score!: number;
    private playerLives!: number;

    // Sterowanie i Timery
    private fireKey!: Phaser.Input.Keyboard.Key;
    private lastFiredTime!: number;
    private fireRate: number = 450;
    private attackTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super("GameScene");
    }

    /**
     * Inicjalizacja danych przed startem sceny.
     */
    init(data: { levelIndex?: number }) {
        this.currentLevelIndex = data.levelIndex || 0;
        this.score = 0;
        this.playerLives = 3;
    }

    /**
     * Ładowanie zasobów.
     */
    preload() {
        // Ścieżki do zasobów (zmień na własne)
        this.load.setPath('assets');

        this.load.image("playerTexture", "player1.png");
        this.load.image("bulletTexture", "bullet.png");
        this.load.image("enemy_blue", "enemy1.png");
        this.load.image("enemy_green", "enemy2.png");
        this.load.image("boss_mothership", "mothership.png");
    }

    /**
     * Tworzenie obiektów gry.
     */
    create() {
        // --- Inicjalizacja sterowania ---
        // ZASTĄP starą linię 'this.fireKey = ...' TĄ linią:
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Stare 'this.lastFiredTime' i 'this.fireRate' zostają bez zmian
        this.lastFiredTime = 0;
        this.fireRate = 250;

        // Ustawienia świata fizyki
        this.physics.world.setBounds(
            0,
            0,
            this.sys.game.config.width as number,
            this.sys.game.config.height as number,
        );

        // Inicjalizacje
        this.paths = new Map();
        this.createPaths();
        this.levelData = levels[this.currentLevelIndex];
        this.enemiesLeftInGame = 0;
        this.nextSlotIndex = 0;
        this.lastFiredTime = 0;

        // Tworzenie siatki formacji
        this.createFormationSlots();

        // Tworzenie gracza
        this.player = this.physics.add.sprite(
            (this.sys.game.config.width as number) / 2,
            (this.sys.game.config.height as number) - 50,
            "playerTexture",
        );
        this.player.setCollideWorldBounds(true);

        // Tworzenie grup fizycznych
        this.playerBullets = this.physics.add.group({
            classType: PlayerBullet,
            runChildUpdate: true,
        });

        this.enemyBullets = this.physics.add.group({
            // classType: EnemyBullet, // (Zakładając, że masz taką klasę)
            runChildUpdate: true,
        });

        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true,
        });

        // Tworzenie UI
        this.scoreText = this.add.text(16, 16, `Score: 0`, {
            fontSize: "24px",
            color: "#ffffff",
        });
        this.livesText = this.add
            .text(
                (this.sys.game.config.width as number) - 16,
                16,
                `Lives: ${this.playerLives}`,
                { fontSize: "24px", color: "#ffffff" },
            )
            .setOrigin(1, 0);

        // Inicjalizacja sterowania
        this.fireKey = this.input.keyboard!.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE,
        );

        // Definicje kolizji
        this.setupCollisions();

        // Timer ataku wrogów
        this.attackTimer = this.time.addEvent({
            delay: 2500,
            callback: this.triggerEnemyAttack,
            callbackScope: this,
            loop: true,
        });

        // Start poziomu
        this.startLevel();
    }

    /**
     * Główna pętla gry.
     */
    update(time: number, delta: number) {
        if (!this.player.active) {
            return; // Nic nie rób, jeśli gracz nie żyje
        }

        this.handlePlayerInput(time);
        this.updateFormationSway(time);
    }

    // --- Metody Inicjalizacyjne (z create()) ---

    /**
     * Definiuje wszystkie ścieżki wejścia.
     */
    private createPaths() {
        const swoopLeft = new Phaser.Curves.Path(-50, 100).splineTo([
            new Phaser.Math.Vector2(200, 150),
            new Phaser.Math.Vector2(400, 50),
            new Phaser.Math.Vector2(600, 150),
        ]);
        this.paths.set("path_swoop_left", swoopLeft);

        const swoopRight = new Phaser.Curves.Path(this.sys.game.config.width as number + 50, 100).splineTo([
            new Phaser.Math.Vector2(600, 150),
            new Phaser.Math.Vector2(400, 50),
            new Phaser.Math.Vector2(200, 150),
        ]);
        this.paths.set("path_swoop_right", swoopRight);

        const zigZag = new Phaser.Curves.Path(400, -50)
            .lineTo(400, 100)
            .lineTo(300, 150)
            .lineTo(500, 200);
        this.paths.set("path_zigzag", zigZag);

        const bossEntry = new Phaser.Curves.Path(
            (this.sys.game.config.width as number) / 2,
            -150,
        ).lineTo((this.sys.game.config.width as number) / 2, 150);
        this.paths.set("path_boss_entry", bossEntry);
    }

    /**
     * Definiuje miejsca w formacji.
     */
    private createFormationSlots() {
        this.formationSlots = [];
        const rows = 4;
        const cols = 8;
        const spacingX = 80;
        const spacingY = 60;
        const startX =
            (this.sys.game.config.width as number) / 2 -
            (spacingX * (cols - 1)) / 2;
        const startY = 100;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.formationSlots.push(
                    new Phaser.Math.Vector2(
                        startX + c * spacingX,
                        startY + r * spacingY,
                    ),
                );
            }
        }
    }

    /**
     * Ustawia wszystkie detektory kolizji.
     */
    private setupCollisions() {
        // Pocisk gracza trafia wroga
        this.physics.add.collider(
            this.playerBullets,
            this.enemies,
            (bullet, enemy) => {
                (bullet as PlayerBullet).destroyBullet();
                (enemy as Enemy).takeDamage(1);
            },
        );

        // Pocisk wroga trafia gracza
        this.physics.add.collider(
            this.enemyBullets,
            this.player,
            (bullet, player) => {
                (bullet as Phaser.Physics.Arcade.Sprite).destroy();
                this.playerHit();
            },
        );

        // Gracz zderza się z wrogiem
        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            this.playerHit();
            (enemy as Enemy).takeDamage(5); // Wróg też obrywa
        });
    }

    // --- Metody Pętli Update ---

    /**
     * Obsługuje strzelanie gracza.
     */
    private handlePlayerInput(time: number) {
        // --- Logika Ruchu ---
        if (this.cursors.left.isDown) {
            // Ruch w lewo
            this.player.setVelocityX(-this.playerSpeed);
        } else if (this.cursors.right.isDown) {
            // Ruch w prawo
            this.player.setVelocityX(this.playerSpeed);
        } else {
            // Gracz nie naciska żadnego kierunku -> zatrzymaj statek
            this.player.setVelocityX(0);
        }

        // --- Logika Strzelania ---
        // (Używamy 'this.cursors.space' zamiast starego 'this.fireKey')
        if (
            this.cursors.space.isDown &&
            time > this.lastFiredTime + this.fireRate
        ) {
            this.firePlayerBullet(time);
        }
    }

    /**
     * Aktualizuje "pływający" ruch formacji.
     */
    private updateFormationSway(time: number) {
        const offsetX =
            Math.sin(time * this.formationSwaySpeed) *
            this.formationSwayAmplitude;
        const offsetY =
            Math.cos(time * this.formationSwaySpeed) *
            (this.formationSwayAmplitude / 3);

        this.enemies.getChildren().forEach((enemyChild) => {
            const enemy = enemyChild as Enemy;
            if (enemy.isInFormation) {
                enemy.x = enemy.formationSlot.x + offsetX;
                enemy.y = enemy.formationSlot.y + offsetY;
            }
        });
    }

    // --- Logika Poziomu i Spawnowania ---

    /**
     * Czyta konfigurację poziomu i rozpoczyna go.
     */
    private startLevel() {
        console.log(`Rozpoczynam poziom ${this.levelData.level}`);
        this.enemiesLeftInGame = 0; // Resetujemy licznik

        if (this.levelData.type === "wave" && this.levelData.waves) {
            this.levelData.waves.forEach((wave) => {
                this.enemiesLeftInGame += wave.count;
                this.spawnWave(wave);
            });
        } else if (this.levelData.type === "boss" && this.levelData.boss) {
            this.enemiesLeftInGame = 1;
            this.spawnBoss(this.levelData.boss);
        }
    }

    /**
     * Tworzy falę wrogów na podstawie konfiguracji.
     */
    private spawnWave(waveConfig: GameWave) {
        const path = this.paths.get(waveConfig.pathKey);
        if (!path) return;

        for (let i = 0; i < waveConfig.count; i++) {
            const enemy = this.enemies.get(0, 0, waveConfig.enemyType) as Enemy;
            if (enemy) {
                enemy.setActive(true).setVisible(true);
                enemy.setStats(waveConfig.health, waveConfig.points);
                enemy.followPath(
                    path,
                    waveConfig.duration,
                    i * waveConfig.delay,
                );

                // Słuchamy, kiedy wróg dotrze do celu i kiedy zginie
                enemy.once("pathComplete", this.onEnemyArrival, this);
                enemy.once("enemyKilled", this.onEnemyKilled, this);
            }
        }
    }

    /**
     * Tworzy bossa na podstawie konfiguracji.
     */
    private spawnBoss(bossConfig: GameBoss) {
        const path = this.paths.get(bossConfig.pathKey);
        if (!path) return;

        const boss = this.enemies.get(0, 0, bossConfig.enemyType) as Enemy;
        if (boss) {
            boss.setActive(true).setVisible(true);
            boss.setStats(bossConfig.health, bossConfig.points);
            boss.setScale(2.5); // Boss jest większy
            boss.followPath(path, bossConfig.duration, 0);

            // Boss nie dolatuje do "formacji", tylko od razu jest gotowy
            boss.once(
                "pathComplete",
                (b: Enemy) => b.emit("inFormation", b),
                this,
            ); // Udajemy, że dotarł do formacji
            boss.once("enemyKilled", this.onEnemyKilled, this);
        }
    }

    // --- Akcje Gracza ---

    /**
     * Wystrzeliwuje pocisk.
     */
    private firePlayerBullet(time: number) {
        this.lastFiredTime = time;
        const bullet = this.playerBullets.get() as PlayerBullet;
        if (bullet) {
            bullet.fire(this.player.x, this.player.y - 30);
        }
    }

    /**
     * Wywoływana, gdy gracz zostaje trafiony.
     */
    private playerHit() {
        if (this.player.isInvincible) return;

        this.playerLives--;
        this.livesText.setText(`Lives: ${this.playerLives}`);

        if (this.playerLives <= 0) {
            this.gameOver();
        } else {
            // Chwilowa nieśmiertelność i miganie
            this.player.isInvincible = true;
            this.tweens.add({
                targets: this.player,
                alpha: 0.5,
                duration: 100,
                ease: "Linear",
                yoyo: true,
                repeat: 5,
                onComplete: () => {
                    this.player.setAlpha(1.0);
                    this.player.isInvincible = false;
                },
            });
        }
    }

    /**
     * Koniec gry.
     */
    private gameOver() {
        this.player.setActive(false).setVisible(false);
        this.attackTimer.remove(); // Zatrzymujemy ataki wrogów
        this.scene.pause();
        this.add
            .text(
                (this.sys.game.config.width as number) / 2,
                (this.sys.game.config.height as number) / 2,
                "GAME OVER",
                { fontSize: "64px", color: "#ff0000" },
            )
            .setOrigin(0.5);
    }

    // --- Akcje Wrogów i Eventy ---

    /**
     * Wywoływana, gdy wróg zakończy ścieżkę wejścia.
     */
    private onEnemyArrival(enemy: Enemy) {
        if (this.nextSlotIndex >= this.formationSlots.length) {
            this.nextSlotIndex = 0; // Pętla, jeśli braknie miejsc
        }

        const targetPos = this.formationSlots[this.nextSlotIndex];
        this.nextSlotIndex++;

        enemy.moveToFormation(targetPos.x, targetPos.y, 1000);

        // Słuchamy, kiedy FAKTYCZNIE dotrze do formacji
        enemy.once("inFormation", this.onEnemyInFormation, this);
    }

    /**
     * Wywoływana, gdy wróg dotrze na swoje miejsce w formacji.
     */
    private onEnemyInFormation(enemy: Enemy) {
        // Wróg jest gotowy do ataku
    }

    /**
     * Wywoływana przez zegar, by wybrać wroga do ataku.
     */
    private triggerEnemyAttack() {
        const availableEnemies = this.enemies
            .getChildren()
            .filter((e) => (e as Enemy).isInFormation);
        if (availableEnemies.length > 0) {
            const attacker = Phaser.Utils.Array.GetRandom(
                availableEnemies,
            ) as Enemy;
            attacker.startAttackRun(this.player);
        }
    }

    // --- Logika Punktów i Końca Poziomu ---

    /**
     * Dodaje punkty do wyniku.
     */
    private addScore(points: number) {
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    /**
     * Wywoływana, gdy wróg ginie.
     */
    private onEnemyKilled(points: number) {
        this.addScore(points);
        this.enemiesLeftInGame--; // Odejmujemy od licznika
        this.checkLevelComplete();
    }

    /**
     * Sprawdza, czy poziom został ukończony.
     */
    private checkLevelComplete() {
        // Poziom kończy się, gdy nie ma już żadnych wrogów w grze
        if (this.enemiesLeftInGame === 0) {
            console.log(`POZIOM ${this.levelData.level} UKOŃCZONY!`);
            this.startNextLevel();
        }
    }

    /**
     * Rozpoczyna kolejny poziom.
     */
    private startNextLevel() {
        this.attackTimer.remove(); // Zatrzymujemy ataki
        this.add
            .text(
                (this.sys.game.config.width as number) / 2,
                (this.sys.game.config.height as number) / 2,
                "LEVEL CLEAR!",
                { fontSize: "48px", color: "#00ff00" },
            )
            .setOrigin(0.5);
 
        this.time.delayedCall(3000, () => {
            const nextLevelIndex = this.currentLevelIndex + 1;
            if (nextLevelIndex >= levels.length) {
                // Koniec gry
                this.add
                    .text(
                        (this.sys.game.config.width as number) / 2,
                        (this.sys.game.config.height as number) / 2 + 60,
                        "GRATULACJE!",
                        { fontSize: "48px", color: "#ffff00" },
                    )
                    .setOrigin(0.5);
                this.scene.pause();
            } else {
                // Restart sceny z nowym indeksem poziomu
                this.scene.restart({ levelIndex: nextLevelIndex });
            }
        });
    }

    changeScene() {
        this.scene.start("GameOver");
    }
}
