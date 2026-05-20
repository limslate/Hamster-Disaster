class Ending extends Phaser.Scene {
    constructor() {
        super("endCopy");
    }


    create() {

        this.win = this.add.image(0, 0, "winScreen")
            .setOrigin(0, 0);
        this.win.scale = 1.6;
        this.winTwo = this.add.image(750, 0, "winScreen")
            .setOrigin(0, 0);
        this.winTwo.scale = 1.6;

      
        this.add.text(520, 650, "Press R to Restart", {
            fontSize: "28px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        });

      
        this.rKey = this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.R
        );
    }

    update() {
 
        if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.start("loadScene");
        }
    }
}