import { Physics, Scene } from 'phaser';

export class PlayerBullet extends Physics.Arcade.Sprite {


    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, 'bulletTexture');
    }

    fire(x: number, y: number, velocityY: number = -500) {
        this.scene.add.existing(this);
        this.scene.physics.world.enable(this);

        this.body!.reset(x, y);

        this.setVelocityY(velocityY);
        
        this.setActive(true);
        this.setVisible(true);

        this.setCollideWorldBounds(true); 
        
    }
    
    // 4. Dodane typy dla 'time' i 'delta'
    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        
        if (this.y <= 0) {
            this.destroyBullet();
        }
    }

    destroyBullet() {
        this.setActive(false);
        this.setVisible(false);
        this.destroy();
    }
}