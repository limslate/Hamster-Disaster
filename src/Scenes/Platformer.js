class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
       
        this.ACCELERATION = 300;
        this.DRAG = 1000;  
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
    }

    create() {

        this.map = this.add.tilemap("HamsterDisaster", 18, 18, 125, 25);

        this.tileset = this.map.addTilesetImage("tilemap_packed", "tilemap_tiles");
        
        this.skyLayer = this.map.createLayer("Background", this.tileset, 0, 0);
        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({
            collides: true
        });
        this.dangerLayer = this.map.createLayer("Danger", this.tileset, 0, 0);
        this.dangerLayer.setCollisionByProperty({
            collides: true
        });
        //this.collectLayer = this.map.createLayer("Objects", this.tileset, 0, 0);
        this.goalLayer = this.map.createLayer("Goal", this.tileset, 0, 0);
        this.mySound = this.sound.add("bang", 1);

        this.coins = this.map.createFromObjects("Objects", {
            name: "Mushroom",
            key: "tilemap_sheet",
            frame: 128
        });
         this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        this.endGoal = this.map.createFromObjects("Objects", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 111
        });
        this.physics.world.enable(this.endGoal, Phaser.Physics.Arcade.STATIC_BODY);
 
       

        this.coinGroup = this.add.group(this.coins);
        this.endGroup = this.add.group(this.endGoal);
        
        my.sprite.player = this.physics.add.sprite(30, 220, "platformer_characters", "tile_0002.png");
        my.sprite.player.setCollideWorldBounds(true);
        this.physics.world.setBounds(0,0,this.map.widthInPixels,this.map.heightInPixels);
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.dangerLayer);
        

        this.coinParticle = this.add.particles(0, 0, 'kenny-particles', {
            frame: 'star_01.png',
            speed: {min: 100, max: 300},
            lifespan: 800,
            scale: {start:0.6, end: 0},
            blendMode: 'ADD',
            quantity: 4,
            emitting: false
        });

        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            
            this.coinParticle.setConfig({
            x: obj2.x,
            y: obj2.y,
            duration: 10,
            frame: 'star_01.png',
            speed: {min: 100, max: 300},
            lifespan: 800,
            scale: {start:0.2, end: 0},
            blendMode: 'ADD',
            quantity: 4,
            emitting: true
            });
            obj2.destroy();
            this.mySound.play();
        });

        this.physics.add.overlap(my.sprite.player, this.endGroup, (obj1, obj2) => {
            this.scene.start("end");
        });
        

       
        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);


        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['dirt_01.png', 'dirt_02.png'],
            scale: {start: 0.03, end: 0.1},
            maxAliveParticles: 10,
            lifespan: 350,
            gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.jumping = this.add.particles(0, 0, "kenny-particles", {
            frame: ['circle_01.png', 'circle_02.png'],
            scale: {start: 0.03, end: 0.1},
            lifespan: 300,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();
        my.vfx.jumping.stop();

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);
        

        this.score = 0;
        this.scoreText = this.add.text(my.sprite.player.x+565, my.sprite.player.y-325, 'Score: 0', {
          fontSize: '12px',
          fill: '#ffffff'
        });
        //this.scoreText.startFollow(my.sprite.player, true, 0.25, 0.25);
        this.scoreText.setText('Score: ' + this.score);
        //this.scoreText.startFollow(my.sprite.player, true, 0.25, 0.25);
        

    }

    update() {
        this.scoreText.setText('Score: ' + this.score);
        
        if (my.sprite.player.y >= 420){
          this.scene.start("loadScene");
        }
        if (my.sprite.player.x >= 2200){
          this.scene.start("endCopy");
          //this.scene.start("loadTwoScene");
        }

        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();


            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
                my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
                my.vfx.walking.start();
            }else{
              my.vfx.walking.stop();
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/10-2, my.sprite.player.displayHeight/2-5, false);
                my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
                my.vfx.walking.start();
            }else{
              my.vfx.walking.stop();
            }
            

        } else {
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');

         my.sprite.player.setAccelerationX(0);

            my.sprite.player.setDragX(this.DRAG);

            my.sprite.player.anims.play('idle');
             my.vfx.walking.stop();
        }

        if(!my.sprite.player.body.blocked.down) {
            my.vfx.jumping.startFollow(my.sprite.player, my.sprite.player.displayWidth/10-2, my.sprite.player.displayHeight/2-5, false);
            my.vfx.jumping.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.sprite.player.anims.play('jump');
            my.vfx.jumping.start();
        }else{
          my.vfx.jumping.stop();
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}