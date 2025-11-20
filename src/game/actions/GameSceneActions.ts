export function preloadGameScene(gameScene: Phaser.Scene): void {
    gameScene.load.setPath('assets')

    gameScene.load.image('playerTexture', 'player1.png')
    gameScene.load.image('borderTexture', 'border.png')
    gameScene.load.image('bulletTexture', 'bullet.png')
    gameScene.load.image('enemyBulletTexture', 'enemyBullet.png')
    gameScene.load.spritesheet('explosion', 'explode.png', { frameWidth: 128, frameHeight: 128, endFrame: 23 })
    gameScene.load.image('starsATexture', 'stars-A.png')
    gameScene.load.image('starsBTexture', 'stars-B.png')
    gameScene.load.image('enemy_blue', 'enemy1.png')
    gameScene.load.image('enemy_green', 'enemy2.png')
    gameScene.load.image('boss_mothership', 'mothership.png')
    gameScene.load.audio('shootSound', 'alienshoot1.wav')


    gameScene.load.audio('explosion1', 'sound/explosion1.mp3')
    gameScene.load.audio('fanfare', 'sound/fanfare.mp3')
}
