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
        this.collectLayer = this.map.createLayer("Collect", this.tileset, 0, 0);
        this.goalLayer = this.map.createLayer("Goal", this.tileset, 0, 0);


        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        this.coinGroup = this.add.group(this.coins);
        
        my.sprite.player = this.physics.add.sprite(30, 220, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        this.physics.world.setBounds(0,0,this.map.widthInPixels,this.map.heightInPixels);
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.dangerLayer);
        // TODO: Add coin collision handler
        

       
        cursors = this.input.keyboard.createCursorKeys();
        this.rKey = this.input.keyboard.addKey('R');
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
       // this.dust = this.add.particles(0, 0, 'kenny-particles', {
         //   frame: 'circle_01.png',
           // speedY: { min: -10, max: 10 },
        //    speedX: { min: -25, max: 25 },
          //  lifespan: 1000,
            //scale: {start: 0.01, end: 0},
        //    blendMode: 'ADD',
          //  quantity: 1,
            //emitting: false     
          //  });
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

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
        
        
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
//            this.dust.setConfig({
  //          x: my.sprite.player.x +5,
    //        y: my.sprite.player.y +10,
      //      frame: 'circle_01.png',
        //    speedY: { min: -10, max: 10 },
          //  speedX: { min: -25, max: 25 },
            //lifespan: 1000,
//            scale: {start: 0.01, end: 0},
  //          blendMode: 'ADD',
    //        quantity: 1,
      //      emitting: true     
        //    });
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
//            this.dust.setConfig({
  //          x: my.sprite.player.x -5,
    //        y: my.sprite.player.y +10,
      //      frame: 'circle_01.png',
        //    speedY: { min: -10, max: 10 },
          //  speedX: { min: -25, max: 25 },
            //lifespan: 1000,
//            scale: {start: 0.01, end: 0},
  //          blendMode: 'ADD',
    //        quantity: 1,
      //      emitting: true     
        //    });
        my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/10-2, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }
            

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
//            this.dust.setConfig({
  //          x: my.sprite.player.x +5,
    //        y: my.sprite.player.y +10,
      //      frame: 'circle_01.png',
        //    speedY: { min: -10, max: 10 },
          //  speedX: { min: -25, max: 25 },
            //lifespan: 1000,
//            scale: {start: 0.01, end: 0},
  //          blendMode: 'ADD',
    //        quantity: 1,
      //      emitting: false     
        //    });
         my.sprite.player.setAccelerationX(0);

            my.sprite.player.setDragX(this.DRAG);

            my.sprite.player.anims.play('idle');
             my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}