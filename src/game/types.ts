export type GameWave = {
    enemyType: string;
    pathKey: string;
    count: number;
    duration: number;
    delay: number;
    health: number;
    points: number;
};

export type GameBoss = {
    enemyType: string; // tekstura przeciwnika
    pathKey: string; // ścieżka wejscia
    duration: number; // Czas wejścia
    health: number; // zdrowie
    points: number; 
};

export type GameLevel = {
    level: number;
} & ({
    type: "wave";
    waves: GameWave[];
} | {
    type: "boss";
    boss: GameBoss;
});
