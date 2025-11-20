import { GameLevel } from './types'

export const levels: readonly GameLevel[] = [
    {
        level: 1,
        type: 'wave',
        waves: [
            {
                enemyType: 'enemy_blue',
                pathKey: 'path_swoop_left',
                count: 3,
                duration: 4000,
                delay: 300,
                health: 1,
                points: 100,
            },
            {
                enemyType: 'enemy_green',
                pathKey: 'path_swoop_right',
                count: 1,
                duration: 4000,
                delay: 300,
                health: 2,
                points: 100,
            },
        ],
    },
    {
        level: 2,
        type: 'boss',
        boss: {
            enemyType: 'boss_mothership',
            pathKey: 'path_boss_entry',
            duration: 8000,
            health: 5,
            points: 10000,
        },
    },
] as const
