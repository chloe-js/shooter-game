//json object
var config = {
    //tries WEB GL first to render and then will go to basic Canvas in the browser
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    // put canvas inside the Game div CREATED in HTML!
    physics: {
        // add static groups and movement for everything
        default: 'arcade',
        arcade: {
            // we dont have any gravity in the game === 0 and dont want sprites to fall
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

//need to make the Game
var game = new Phaser.Game(config);
//ENEMY INFO
enemyInfo = {
    // config when want to have a field of something (brinks in Atari breakout or enemies in space invaders)
    width: 40,
    height: 20,
    count: {
        row: 5,
        col: 9
    },
    offset: {
        top: 150,
        left: 60
    },
    // padding between each enemy
    padding: 5
};

var move = new Howl({
    src: ['assets/move.mp3']
});

var shootSound = new Howl({
    src: ['assets/shoot.mp3']
});

var explosionSound = new Howl({
    src: ['assets/explosion.mp3']
});

var saucerSound = new Howl({
    //because this sound is so short , need to loop through it to keep playing === will only stop when we make the function for it to play and stop
    src: ['assets/saucer.mp3'],
    loop: true
});

function preload() {
    this.load.image("shooter", "assets/x-wing.png")
    this.load.image("alien", "assets/tieFighters.png")
    this.load.image("bullet", "assets/fire.png")
    this.load.image("saucer", "assets/deathstar.png")
}

var score = 0;
var lives = 3;
var isStarted = false;
var barriers = [];
var ufoCount = 0;
function create() {
    // the scene object will only matter when we are outside of the CREATE()== inside the Create we can use this and out side we cant
    scene = this;
    cursors = scene.input.keyboard.createCursorKeys();
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    isShooting = false;
    this.input.keyboard.addCapture('SPACE');
    enemies = this.physics.add.staticGroup();
    // if you are a player at thte bootom and you fire up. Phaser needs to know to destroy it and we are going to add a collision on thius top lava and if it touches it, it is going to destroy it
    // 0x000 === hex code for black
    playerLava = scene.add.rectangle(0, 0, 800, 10, 0x000).setOrigin(0)
    enemyLava = scene.add.rectangle(0, 590, 800, 10, 0x000).setOrigin(0)
    saucerLava = scene.add.rectangle(790, 0, 10, 600, 0x000).setOrigin(0)
    // you want see these in debug because they are apart of the scene group and not the physics group
    // add to physics group
    scene.physics.add.existing(playerLava)
    scene.physics.add.existing(enemyLava)
    scene.physics.add.existing(saucerLava)

    //add shooter
    // add sprite and cant drive it off edge of the screen
    shooter = scene.physics.add.sprite(400, 560, 'shooter');
    shooter.setCollideWorldBounds(true)

    //add text onto screen
    scoreText = scene.add.text(16, 16, "Score: " + score, { fontSize: '18px', fill: '#FFF' })
    livesText = scene.add.text(696, 16, "Lives: " + lives, { fontSize: '18px', fill: '#FFF' })
    //middle of the game
    startText = scene.add.text(400, 300, "Click to Play", { fontSize: '18px', fill: '#FFF' }).setOrigin(0.5)

    // add the listeners
    this.input.keyboard.on('keydown-SPACE', shoot); // shoot is a function

    // add barrier definition with second last one removed 
    barriers.push(new Barrier(scene, 50, 450))
    barriers.push(new Barrier(scene, 370, 450))
    barriers.push(new Barrier(scene, 690, 450))

    this.input.on('pointerdown', function () {
        if (isStarted == false) {
            isStarted = true;
            startText.destroy()
            setInterval(makeSaucer, 15000)
            // need to create makeSaucer function so this will run
        } else {
            shoot()
        }
    });
    initEnemies()
}

function update() {
    //how we are going to move
    if (isStarted == true) {
        //cursors was defined in earlier
        if (cursors.left.isDown || keyA.isDown) {
            shooter.setVelocityX(-160);

        }
        else if (cursors.right.isDown || keyD.isDown) {
            shooter.setVelocityX(160);

        }
        else {
            shooter.setVelocityX(0);

        }
    }
}

function shoot() {
    if (isStarted == true) {
        //cant double fire or rapid fire
        if (isShooting === false) {
            manageBullet(scene.physics.add.sprite(shooter.x, shooter.y, "bullet"))
            isShooting = true;
            shootSound.play()
            // will only fire once if dont set var to false again
        }
    }
}

function initEnemies() {
    //c == columns r === rows
    for (c = 0; c < enemyInfo.count.col; c++) {
        for (r = 0; r < enemyInfo.count.row; r++) {
            var enemyX = (c * (enemyInfo.width + enemyInfo.padding)) + enemyInfo.offset.left;
            var enemyY = (r * (enemyInfo.height + enemyInfo.padding)) + enemyInfo.offset.top;
            enemies.create(enemyX, enemyY, 'alien').setOrigin(0.5);
        }
    }
}

setInterval(moveEnemies, 1000)
var xTimes = 0;
var yTimes = 0;
var dir = "right"

function moveEnemies() {
    if (isStarted === true) {
        move.play()
        if (xTimes === 20) {
            if (dir === "right") {
                dir = "left"
                xTimes = 0
            } else {
                dir = "right"
                xTimes = 0
            }
        }
        /// moves whole blocks of the enemies
        if (dir === "right") {
            enemies.children.each(function (enemy) {

                enemy.x = enemy.x + 10;
                enemy.body.reset(enemy.x, enemy.y);

            }, this);
            xTimes++;
        } else {
            enemies.children.each(function (enemy) {

                enemy.x = enemy.x - 10;
                enemy.body.reset(enemy.x, enemy.y);

            }, this);
            xTimes++;

        }
    }
}

function manageBullet(bullet) {
    bullet.setVelocityY(-380);


    var i = setInterval(function () {
        enemies.children.each(function (enemy) {

            if (checkOverlap(bullet, enemy)) {
                bullet.destroy();
                clearInterval(i)
                isShooting = false
                enemy.destroy()
                score++;
                scoreText.setText("Score: " + score);

                explosionSound.play()

                if ((score - ufoCount) === (enemyInfo.count.col * enemyInfo.count.row)) {
                    end("Win")
                }
            }

        }, this);
        for (var step = 0; step < barriers.length; step++) {
            if (barriers[step].checkCollision(bullet)) {
                //destroys bullet
                bullet.destroy();
                clearInterval(i)
                isShooting = false

                scoreText.setText("Score: " + score);

                explosionSound.play()

                if ((score - ufoCount) === (enemyInfo.count.col * enemyInfo.count.row)) {
                    end("Win")
                }


            }
        }

        for (var step = 0; step < saucers.length; step++) {
            var saucer = saucers[step];
            if (checkOverlap(bullet, saucer)) {
                bullet.destroy();
                clearInterval(i)
                isShooting = false

                scoreText.setText("Score: " + score);


                explosionSound.play()

                if ((score - ufoCount) === (enemyInfo.count.col * enemyInfo.count.row)) {
                    end("Win")
                }

                saucer.destroy()
                saucer.isDestroyed = true;
                saucerSound.stop();
                score++;
                ufoCount++;
            }
        }
    }, 10)
    scene.physics.add.overlap(bullet, playerLava, function () {
        bullet.destroy();
        clearInterval(i);
        explosionSound.play();
        isShooting = false
    })

}
var enemyBulletVelo = 200;
function manageEnemyBullet(bullet, enemy) {
    //the enemy shoots at you instead of just down 
    var angle = Phaser.Math.Angle.BetweenPoints(enemy, shooter);
    scene.physics.velocityFromRotation(angle, enemyBulletVelo, bullet.body.velocity);
    //want bullets to go faster every time they shoot
    enemyBulletVelo = enemyBulletVelo + 2
    var i = setInterval(function () {

        if (checkOverlap(bullet, shooter)) {
            bullet.destroy();
            clearInterval(i);
            lives--;
            livesText.setText("Lives: " + lives);
            explosionSound.play()

            if (lives == 0) {
                end("Lose")
            }
        }
        for (var step = 0; step < barriers.length; step++) {
            if (barriers[step].checkCollision(bullet)) {
                //destroys bullet
                bullet.destroy();
                clearInterval(i)
                isShooting = false

                scoreText.setText("Score: " + score);


                explosionSound.play()

                if (score === (enemyInfo.count.col * enemyInfo.count.row)) {
                    end("Win")
                }
            }
        }
    }, 10)
    //use the lavas to detect
    // bullets shoot down and is destroyed in lava
    scene.physics.add.overlap(bullet, enemyLava, function () {
        bullet.destroy();
        explosionSound.play();
        clearInterval(i);
    })

}
//function to RETURN TRUE IF if 2 sprites are colliding
function checkOverlap(spriteA, spriteB) {
    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
}

//ENEMY FIRE
// set enemy fire ever 3 seconds to do function of enemy fire
setInterval(enemyFire, 3000)

function enemyFire() {
    if (isStarted === true) {
        //grab random number
        var enemy = enemies.children.entries[Phaser.Math.Between(0, enemies.children.entries.length - 1)];
        manageEnemyBullet(scene.physics.add.sprite(enemy.x, enemy.y, "bullet"), enemy)
    }
}

//FLYING SAUCER
var saucers = [];
function makeSaucer() {
    if (isStarted == true) {
        manageSaucer(scene.physics.add.sprite(0, 60, "saucer"));
    }
}
//SAUCER FIRE
setInterval(function () {
    if (isStarted == true) {
        for (var i = 0; i < saucers.length; i++) {
            var saucer = saucers[i];
            if (saucer.isDestroyed == false) {
                manageEnemyBullet(scene.physics.add.sprite(saucer.x, saucer.y, "bullet"), saucer)

            } else {
                saucers.splice(i, 1);
            }
        }
    }

}, 2000)

function manageSaucer(saucer) {
    saucers.push(saucer);
    saucer.isDestroyed = false;
    saucer.setVelocityX(100);
    scene.physics.add.overlap(saucer, saucerLava, function () {
        saucer.destroy()
        saucer.isDestroyed = true;
        saucerSound.stop()
    })
    saucerSound.play()
}

//BARRIERS
class Barrier {
    constructor(scene, gx, y) {
        var x = gx;
        var y = y;
        this.children = [];
        // so you can use it in another part of the class
        this.scene = scene;

        for (var r = 0; r < 3; r++) {
            for (var c = 0; c < 3; c++) {
                // hex code 1ff56 same color as shooter
                var child = scene.add.rectangle(x, y, 30, 20, 0x0000ff);
                scene.physics.add.existing(child);
                // you can take 2 shots before the child is destroyed
                // child is a block in the barrior and it is made out of 5 blocks
                child.health = 2;
                // push this to the array
                this.children.push(child)
                // incrementing the x
                x = x + child.displayWidth;
            }
            x = gx;
            y = y + child.displayHeight;
        }

        //second for loop === we are going to remove the middle one
        this.children[this.children.length - 2].destroy();
        this.children.splice(this.children.length - 2, 1);
    }

    checkCollision(sprite) {
        var isTouching = false;

        // incrementing through each child
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];

            if (checkOverlap(sprite, child)) {
                isTouching = true;

                if (this.children[i].health === 1) {
                    child.destroy();
                    this.children.splice(i, 1);

                } else {
                    this.children[i].health--;

                }
                break;
            }
        }
        return isTouching;
    }
}

//how we end the game
function end(con) {
    explosionSound.stop();
    saucerSound.stop();
    shootSound.stop();
    move.stop()

    alert(`You ${con}! Score: ` + score);
    location.reload()

}