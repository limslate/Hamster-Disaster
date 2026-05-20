class End extends Phaser.Scene {
    constructor() {
        super("end");
    }

    init(){
        this.ACCELERATION = 300;
        this.DRAG = 1000;
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.SCALE = 2.0;
        
    }

    create() {
        cursors = this.input.keyboard.createCursorKeys();

        this.map = this.add.tilemap("WinScreen", 18, 18, 25, 25);

        this.tileset = this.map.addTilesetImage("tilemap_sheet", "tilemap_tiles");

        this.skyLayer = this.map.createLayer("Background", this.tileset, 0, 0);

        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
        this.groundLayer.setCollisionByProperty({
            collides: true
        });


        my.sprite.player = this.physics.add.sprite(30, 220, "platformer_characters", "tile_0002.png");
        my.sprite.player.setCollideWorldBounds(true);

        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Retry flag objects
        this.flagObjects = this.map.createFromObjects("Retry", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 111
        });

        console.log(this.flagObjects);

        // Static physics group
        this.flagsGroup = this.physics.add.staticGroup();

        this.flagObjects.forEach((obj) => {
            this.flagsGroup.add(obj);
        });

        // Overlap
        this.physics.add.overlap(
            my.sprite.player,
            this.flagsGroup,
            () => {
                console.log("FLAG HIT");
                this.scene.start("loadScene");
            }
        );
    }

    update() {

        if (cursors.left.isDown) {

            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();

            if (my.sprite.player.body.blocked.down) {
                my.sprite.player.anims.play('walk', true);
            }


        } else if (cursors.right.isDown) {

            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);

            if (my.sprite.player.body.blocked.down) {
                my.sprite.player.anims.play('walk', true);
            }

        } else {

            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);

            if (my.sprite.player.body.blocked.down) {
                my.sprite.player.anims.play('idle', true);
            }
        }

  
        if (!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump', true);
        }


        if (
            my.sprite.player.body.blocked.down &&
            Phaser.Input.Keyboard.JustDown(cursors.up)
        ) {
            my.sprite.player.setVelocityY(this.JUMP_VELOCITY);
        }
    }
}