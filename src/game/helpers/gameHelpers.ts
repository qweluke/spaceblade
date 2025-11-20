export function getGameWidth(scene: Phaser.Scene): number {
    return Number(String(scene.sys.game.config.width))
}

export function getGameHeight(scene: Phaser.Scene): number {
    return Number(String(scene.sys.game.config.height))
}

export function getGameCenterX(scene: Phaser.Scene): number {
    return getGameWidth(scene) / 2
}

export function getGameCenterY(scene: Phaser.Scene): number {
    return getGameHeight(scene) / 2
}