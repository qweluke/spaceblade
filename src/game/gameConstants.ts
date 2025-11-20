export class GameConstants {
    // Player
    static readonly PLAYER_SPEED = 400
    static readonly PLAYER_START_Y_OFFSET = 50
    static readonly FIRE_RATE = 250
    static readonly BULLET_OFFSET_Y = -30
    static readonly INITIAL_LIVES = 1
    static readonly INITIAL_SCORE = 0

    // Enemy & Formation
    static readonly ATTACK_TIMER_DELAY = 2500
    static readonly ENEMY_SHOOT_TIMER_DELAY = 1500 // How often enemies shoot from formation
    static readonly ENEMY_BULLET_SPEED = 300
    static readonly ENEMY_BULLET_OFFSET_Y = 30
    static readonly FORMATION_MOVE_DURATION = 1000
    static readonly FORMATION_ROWS = 4
    static readonly FORMATION_COLS = 8
    static readonly FORMATION_SPACING_X = 80
    static readonly FORMATION_SPACING_Y = 60
    static readonly FORMATION_START_Y = 100
    static readonly ENEMY_COLLISION_DAMAGE = 5
    static readonly PLAYER_BULLET_DAMAGE = 1

    // UI
    static readonly BORDER_WIDTH = 50
    static readonly BORDER_SCROLL_SPEED = 1
    static readonly STARS_SCROLL_SPEED_A = 1.2 // front stars
    static readonly STARS_SCROLL_SPEED_B = 0.8 // foreground stars
    static readonly HUD_PADDING = 16
    static readonly HUD_FONT_SIZE = '24px'
    static readonly HUD_COLOR = '#ffffff'

    // Game Flow
    static readonly INVINCIBILITY_FLASH_DURATION = 100
    static readonly INVINCIBILITY_FLASH_REPEATS = 5
    static readonly LEVEL_COMPLETE_DELAY = 3000
}
