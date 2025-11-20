const GameState2 = {
    INTRO: 'INTRO',
    PLAYING: 'PLAYING',
    LEVEL_COMPLETE: 'LEVEL_COMPLETE',
    GAME_OVER: 'GAME_OVER',
    GAME_END: 'GAME_END',
} as const

export enum GameState {
    INTRO = 'INTRO',
    PLAYING = 'PLAYING',
    LEVEL_COMPLETE = 'LEVEL_COMPLETE',
    GAME_OVER = 'GAME_OVER',
    GAME_END = 'GAME_END',
}
