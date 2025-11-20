import * as Phaser from 'phaser'
import { getGameHeight, getGameWidth } from './helpers/gameHelpers'

// Definiujemy typy stanów, żeby kod był czytelniejszy
type EnemyState = 'spawning' | 'inFormation' | 'attacking' | 'returning' | 'dead'

export class Enemy extends Phaser.Physics.Arcade.Sprite {
    // Ścieżki i ruch
    private path!: Phaser.Curves.Path
    private pathFollower!: { t: number; vec: Phaser.Math.Vector2 }
    private pathTween?: Phaser.Tweens.Tween // Może nie istnieć, więc '?'

    // Stan
    public formationSlot: Phaser.Math.Vector2 // Miejsce "domowe" w formacji
    public formationSlotIndex: number | null = null // Indeks slotu w formacji
    public currentState: EnemyState

    // Statystyki
    private health: number = 1
    protected pointsValue: number = 100
    public type: 'wave' | 'boss' = 'wave'

    private gameScene: Phaser.Scene // Możesz tu użyć 'GameScene' jeśli ją zaimportujesz

    // --- Metody Główne ---

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture)

        this.gameScene = scene // Zapisujemy referencję do sceny
        this.pathFollower = { t: 0, vec: new Phaser.Math.Vector2() }
        this.formationSlot = new Phaser.Math.Vector2()
        this.currentState = 'spawning' // Zaczyna w stanie "spawnowania"
    }


    public getPointsValue(): number {
        return this.pointsValue
    }
    /**
     * Ustawia statystyki wroga (wywoływane przez GameScene).
     */
    public setStats(health: number, points: number): this {
        this.health = health || 1
        this.pointsValue = points || 100

        return this
    }

    public setType(type: 'wave' | 'boss'): void {
        this.type = type
    }
    /**
     * Zwraca, czy wróg jest "zaparkowany" w formacji.
     */
    get isInFormation(): boolean {
        return this.currentState === 'inFormation'
    }

    /**
     * Rozpoczyna lot wzdłuż zdefiniowanej ścieżki wejścia.
     */
    public followPath(path: Phaser.Curves.Path, duration: number, delay: number = 0): void {
        this.path = path
        this.pathFollower.t = 0
        this.currentState = 'spawning'

        // Ustaw pozycję startową
        this.path.getStartPoint(this.pathFollower.vec)
        this.body!.reset(this.pathFollower.vec.x, this.pathFollower.vec.y)

        // Zatrzymujemy stary tween, jeśli jakiś istniał
        if (this.pathTween) this.pathTween.stop()

        this.pathTween = this.scene.tweens.add({
            targets: this.pathFollower,
            t: 1,
            ease: 'Linear',
            duration: duration,
            delay: delay,
            onUpdate: this.onPathUpdate.bind(this),
            onComplete: this.onPathComplete.bind(this),
        })
    }

    private onPathUpdate = () => {
        if (!this.active) return // Przestań, jeśli wróg zginął w trakcie

        // Aktualizuj pozycję
        this.path.getPoint(this.pathFollower.t, this.pathFollower.vec)
        this.setPosition(this.pathFollower.vec.x, this.pathFollower.vec.y)

        // Aktualizuj rotację
        const tangent = this.path.getTangent(this.pathFollower.t)
        this.setRotation(tangent.angle() + Math.PI / 2) // +PI/2 jeśli sprite patrzy w górę
    }

    /**
     * Wywoływana po zakończeniu ścieżki wejścia.
     */
    private onPathComplete(): void {
        this.pathTween = undefined
        if (this.active) {
            this.emit('pathComplete', this)
        }
    }

    /**
     * Rozpoczyna płynny ruch do docelowego miejsca w formacji.
     */
    public moveToFormation(targetX: number, targetY: number, duration: number): void {
        if (!this.active) return

        this.formationSlot.set(targetX, targetY)
        this.currentState = 'returning' // Stan "powrotu" (lub dolotu) do formacji

        if (this.pathTween) {
            this.pathTween.stop()
        }

        this.pathTween = this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            rotation: 0, // Wyprostuj statek
            duration: duration,
            ease: 'Cubic.Out',
            onComplete: () => {
                this.pathTween = undefined
                if (this.active) {
                    this.currentState = 'inFormation'
                    this.emit('inFormation', this)
                }
            },
        })
    }

    /**
     * Rozpoczyna lot atakujący w kierunku gracza.
     */
    public startAttackRun(player: Phaser.GameObjects.Sprite): void {
        if (this.currentState !== 'inFormation' || !this.active || !player.active) {
            return // Atakuj tylko z formacji i jeśli gracz żyje
        }

        this.currentState = 'attacking'

        // Tworzenie dynamicznej ścieżki ataku
        const startPoint = new Phaser.Math.Vector2(this.x, this.y)
        const playerPos = new Phaser.Math.Vector2(player.x, player.y)

        // Punkty kontrolne dla krzywej Beziera (dla fajnego łuku)
        const controlPoint1 = new Phaser.Math.Vector2(startPoint.x, startPoint.y + 150)
        const controlPoint2 = new Phaser.Math.Vector2(playerPos.x + Phaser.Math.Between(-200, 200), playerPos.y + 50)
        const endPoint = new Phaser.Math.Vector2(
            Phaser.Math.Between(0, getGameWidth(this.gameScene)),
            getGameHeight(this.gameScene) + 100
        )

        const attackCurve = new Phaser.Curves.CubicBezier(startPoint, controlPoint1, controlPoint2, endPoint)

        // Używamy tego samego 'pathFollower'
        this.pathFollower.t = 0
        if (this.pathTween) {
            this.pathTween.stop()
        }

        this.pathTween = this.scene.tweens.add({
            targets: this.pathFollower,
            t: 1,
            ease: 'Linear',
            duration: 3000, // Czas ataku
            onUpdate: () => {
                if (!this.active) return

                attackCurve.getPoint(this.pathFollower.t, this.pathFollower.vec)
                this.setPosition(this.pathFollower.vec.x, this.pathFollower.vec.y)

                const tangent = attackCurve.getTangent(this.pathFollower.t)
                this.setRotation(tangent.angle() + Math.PI / 2)
            },
            onComplete: () => {
                this.onAttackRunComplete()
            },
        })
    }

    /**
     * Wywoływana po zakończeniu ataku (wylot poza ekran).
     */
    private onAttackRunComplete(): void {
        this.pathTween = undefined
        if (!this.active) return // Nic nie rób, jeśli zginął w trakcie

        // Teleportuj na górę (nad swoje miejsce) i wróć do formacji
        this.setPosition(this.formationSlot.x, -100)
        this.setRotation(0)
        this.moveToFormation(this.formationSlot.x, this.formationSlot.y, 2000) // 2 sekundy na powrót
    }

    // --- Logika Zdrowia i Śmierci ---

    /**
     * Wywoływana, gdy wróg otrzyma obrażenia.
     */
    public takeDamage(damage: number): void {
        if (this.currentState === 'dead' || !this.active) {
            return // Już martwy
        }

        this.health -= damage

        if (this.health <= 0) {
            this.die()
        } else {
            // Efekt trafienia: mignij na czerwono
            this.setTint(0xff0000)
            this.scene.time.delayedCall(50, () => {
                if (this.active) {
                    // Sprawdź, czy wciąż istnieje
                    this.clearTint()
                }
            })
        }
    }

    /**
     * Logika śmierci wroga.
     */
    private die(): void {
        if (this.currentState === 'dead') return

        this.currentState = 'dead'
        this.setActive(false) // Zatrzymuje kolizje

        // Zatrzymaj wszystkie ruchy
        if (this.pathTween) {
            this.pathTween.stop()
            this.pathTween = undefined
        }

        // Emituj zdarzenie do GameScene z wartością punktową i referencją do wroga
        this.emit('enemyKilled', this)

        // TODO: Dodaj animację eksplozji
        // np. this.play('explosion').on('animationcomplete', () => this.destroy());

        // Na razie po prostu zniknij i zniszcz obiekt
        this.setVisible(false)
        this.destroy() // Bezpieczne usunięcie obiektu
    }
}
