window.addEventListener('load', function () {
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.width = 1200;
  canvas.height = 500;

  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener('keydown', e => {
        if ((
          (e.key === 'ArrowUp') ||
          (e.key === 'ArrowDown')
        ) &&
          (this.game.keys.indexOf(e.key) === -1)
          && !this.game.gameOver) {
          this.game.keys.push(e.key);
        }
        else if (e.key === ' ' && !this.game.gameOver) {
          this.game.player.shootTop();
        }
        else if (e.key === 'd') {
          this.game.debug = !this.game.debug;
        }
      })

      window.addEventListener('keyup', e => {
        if (this.game.keys.indexOf(e.key) > -1) {
          this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
        }
      })
    }

  }

  class Projectile {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.width = 10;
      this.height = 3;
      this.speed = 5;
      this.markedForDeletion = false;
      this.image = document.getElementById('projectile');
    }
    update() {
      this.x += this.speed;
      if (this.x > this.game.width * 0.9) this.markedForDeletion = true;
    }
    draw(context) {
      // context.fillStyle = 'yellow';
      // context.fillRect(this.x, this.y, this.width, this.height);
      context.drawImage(this.image, this.x, this.y)
    }
  }

  class Particle {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.image = document.getElementById('gears');
      this.frameX = Math.floor(Math.random() * 3);
      this.frameY = Math.floor(Math.random() * 3);
      this.spriteSize = 50;
      this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1);
      this.size = this.spriteSize * this.sizeModifier;
      this.speedX = Math.random() * 6 - 3;
      this.speedY = Math.random() * -15;
      this.gravity = 0.5;
      this.markedForDeletion = false;
      this.angle = 0;
      this.va = Math.random() * 0.2 - 0.1;
      this.bounced = 0;
      this.bounceBoundary = Math.random() * 100 + 60;
    }

    update() {
      this.angle += this.va;
      this.speedY += this.gravity;
      this.x += this.speedX - this.game.speed;
      this.y += this.speedY;
      if (this.y > this.game.height + this.size || this.x < 0 - this.size) {
        this.markedForDeletion = true;
      }
      if (this.y > this.game.height - this.bounceBoundary && this.bounced < 2) {
        this.bounced++;
        this.speedY *= -0.5;
      }
    }

    draw(context) {
      context.save();
      context.translate(this.x, this.y);
      context.rotate(this.angle);
      context.drawImage(this.image, this.frameX * this.spriteSize, this.frameY * this.spriteSize, this.spriteSize, this.spriteSize, this.size * -0.5, this.size * -0.5, this.size, this.size);
      context.restore();
    }
  }

  class Player {
    constructor(game) {
      this.game = game;
      this.width = 120;
      this.height = 190;
      this.x = 20;
      this.y = 100;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37;
      this.speedY = 0;
      this.maxSpeed = 3;
      this.projectiles = [];
      this.image = document.getElementById('player');
      this.powerUps = false;
      this.powerUpsTimer = 0;
      this.powerLimits = 10000;
    }
    update(deltaTime) {
      if (this.game.keys.includes('ArrowUp')) {
        this.speedY = -this.maxSpeed;
      }
      else if (this.game.keys.includes('ArrowDown')) {
        this.speedY = this.maxSpeed;
      }
      else {
        this.speedY = 0;
      }
      this.y += this.speedY;

      if (this.y > this.game.height - this.height * 0.5) {
        this.y = this.game.height - this.height * 0.5;
      } else if (this.y < -this.height * 0.5) {
        this.y = -this.height * 0.5;
      }

      if (this.frameX > this.maxFrame) {
        this.frameX = 0
      } else {
        this.frameX++;
      }
      //handle projectiles
      this.projectiles.forEach(projectile => {
        projectile.update();
      });
      this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
      //power up
      if (this.powerUps) {
        if (this.powerUpsTimer > this.powerLimits) {
          this.powerUpsTimer = 0;
          this.frameY = 0;
          this.powerUps = false;
        } else {
          this.powerUpsTimer += deltaTime;
          this.frameY = 1;
          this.game.ammo += 0.1;
        }
      }
    }
    draw(context) {
      if (this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height)
      //draw projectile
      this.projectiles.forEach(projectile => {
        projectile.draw(context);
      });
      context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
    }
    shootTop() {
      if (this.game.ammo > 0) {
        this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 30))
        this.game.ammo--;
      }
      if (this.powerUps) this.shootBottom();
    }
    shootBottom() {
      if (this.game.ammo > 0) {
        this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 175));
      }
    }
    enterPowerUp() {
      if (this.game.ammo > 0) {
        this.powerUps = true;
        this.powerUpsTimer = 0;
        if (this.game.ammo < this.game.maxAmmo) this.game.ammo = this.game.maxAmmo;
      }
    }
  }

  class Enemy {
    constructor(game) {
      this.game = game;
      this.x = this.game.width;
      this.speedX = Math.random() * -1.5 - 0.5;
      this.markedForDeletion = false;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37;
    }
    update() {
      this.x += this.speedX - this.game.speed;
      if (this.x + this.width < 0) this.markedForDeletion = true;
      //sprite animation
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }
    }
    draw(context) {
      if (this.game.debug) {
        context.strokeRect(this.x, this.y, this.width, this.height);
        context.fillStyle = 'black';
        context.font = '20px Helvetica'
        context.fillText(this.lives, this.x, this.y - 5);
      }
      context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
    }
  }

  class Angler1 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 228;
      this.height = 169;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById('angler1');
      this.frameY = Math.floor(Math.random() * 3);
      this.lives = 2;
      this.score = this.lives;
      this.type = 'angler1';
    }
  }

  class Angler2 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 213;
      this.height = 169;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById('angler2');
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 3;
      this.score = this.lives;
      this.type = 'angler2';
    }
  }
  class LuckyFish extends Enemy {
    constructor(game) {
      super(game);
      this.width = 99;
      this.height = 95;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById('lucky');
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 3;
      this.score = 15;
      this.type = 'lucky';
    }
  }
  class HiveWhale extends Enemy {
    constructor(game) {
      super(game);
      this.width = 400;
      this.height = 227;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById('hiveWhale');
      this.frameY = 0;
      this.lives = 15;
      this.score = this.lives;
      this.type = 'hiveWhale';
      this.speedX = Math.random() * -1.2 - 0.2;
    }
  }
  class Drone extends Enemy {
    constructor(game, x, y) {
      super(game);
      this.width = 115;
      this.height = 95;
      this.x = x;
      this.y = y;
      this.image = document.getElementById('drone');
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 3;
      this.score = this.lives;
      this.type = 'drone';
      this.speedX = Math.random() * -4.5 - 0.5;
    }
  }

  class Layer {
    constructor(game, image, speedModifier) {
      this.game = game;
      this.image = image;
      this.speedModifier = speedModifier;
      this.width = 1768;
      this.height = 500;
      this.x = 0;
      this.y = 0;
    }

    update() {
      if (this.x <= -this.width) this.x = 0;
      this.x -= this.game.speed * this.speedModifier;
    }
    draw(context) {
      context.drawImage(this.image, this.x, this.y);
      context.drawImage(this.image, this.x + this.width, this.y);
    }
  }

  class Background {
    constructor(game) {
      this.game = game;
      this.image1 = document.getElementById('layer1');
      this.image2 = document.getElementById('layer2');
      this.image3 = document.getElementById('layer3');
      this.image4 = document.getElementById('layer4');
      this.layer1 = new Layer(this.game, this.image1, 0.2);
      this.layer2 = new Layer(this.game, this.image2, 0.4);
      this.layer3 = new Layer(this.game, this.image3, 1);
      this.layer4 = new Layer(this.game, this.image4, 1.5);
      this.layers = [this.layer1, this.layer2, this.layer3];
    }
    update() {
      this.layers.forEach(layer => layer.update())
    }
    draw(context) {
      this.layers.forEach(layer => layer.draw(context))
    }
  }

  class Explosion {
    constructor(game, x, y) {
      this.game = game;
      this.frameX = 0;
      this.maxFrame = 8;
      this.spriteHeight = 200;
      this.spriteWidth = 200;
      this.width = this.spriteHeight;
      this.height = this.spriteHeight;
      this.x = x - this.width * 0.5;
      this.y = y - this.height * 0.5;
      this.fps = 25;
      this.timer = 0;
      this.interval = 1000 / this.fps;
      this.markedForDeletion = false;
    }

    update(deltaTime) {
      this.x -= this.game.speed;
      if (this.timer > this.interval) {
        this.frameX++;
        this.timer = 0;
      } else {
        this.timer += deltaTime;
      }
      if (this.frameX > this.maxFrame) this.markedForDeletion = true;
    }

    draw(context) {
      context.drawImage(this.image, this.frameX * this.spriteWidth, 0, this.width, this.height, this.x, this.y, this.width, this.height)
    }
  }

  class SmokeExplosion extends Explosion {
    constructor(game, x, y) {
      super(game, x, y)
      this.image = document.getElementById('smokeExplosion');
    }
  }
  class FireExplosion extends Explosion {
    constructor(game, x, y) {
      super(game, x, y)
      this.image = document.getElementById('fireExplosion');
    }
  }

  class UI {
    constructor(game) {
      this.game = game;
      this.fontSize = 25;
      this.fontFamily = 'Luckiest Guy';
      this.color = 'white'
    }
    draw(context) {
      context.save();
      context.font = `${this.fontSize}px ${this.fontFamily}`
      context.fillStyle = this.color;
      //score
      context.fillText(`Score: ${this.game.score}`, 20, 40);

      const remainingTime = this.game.timeLimit - this.game.gameTime;
      const remainingTimeFixed = (remainingTime / 1000).toFixed(0);
      //game time
      context.fillText(`Time remaining: ${Math.abs(remainingTimeFixed)}s`, 20, 100)
      //game over message
      if (this.game.gameOver) {
        context.textAlign = 'center';
        let message1;
        let message2;
        if (this.game.score >= this.game.winningScore) {
          message1 = 'You Win!';
          message2 = 'Well Done';
        } else {
          message1 = 'You lose!';
          message2 = 'Try again'
        }
        context.fillText(message2, canvas.width / 2, canvas.height / 2 + 20);
        context.font = `50px ${this.fontFamily}`
        context.fillText(message1, canvas.width / 2, canvas.height / 2 - 20);
      }
      //ammo
      if (this.game.player.powerUps) context.fillStyle = '#ffffbd'
      for (let i = 0; i < this.game.ammo; i++) {
        context.fillRect(20 + 7 * i, 50, 3, 20);
      }
      context.restore();
    }
  }

  //the main game class
  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.background = new Background(this);
      this.player = new Player(this);
      this.input = new InputHandler(this);
      this.keys = [];   //keys pressed by player
      this.enemies = [];
      this.particles = [];
      this.explosions = [];
      this.enemyTimer = 0;
      this.enemyInterval = 1000;
      this.ui = new UI(this);
      this.ammo = 20;
      this.maxAmmo = 30;
      this.ammoTimer = 0;
      this.ammoInterval = 2000;
      this.score = 0;
      this.winningScore = 300;
      this.gameTime = 0;
      this.timeLimit = 60000;
      this.gameOver = false;
      this.speed = 1;
      this.debug = false;
    }
    update(deltaTime) {
      //checking game time
      if (!this.gameOver) this.gameTime += deltaTime;
      let remainingTime = this.timeLimit - this.gameTime;
      if (remainingTime < 0) this.gameOver = true;
      this.background.update();
      this.background.layer4.update();
      this.player.update(deltaTime);

      //recharg ammo after a period of time
      if (this.ammoTimer > this.ammoInterval && !this.gameOver) {
        if (this.ammo < this.maxAmmo) this.ammo++;
        this.ammoTimer = 0;
      } else {
        this.ammoTimer += deltaTime;
      }
      //particle
      this.particles.forEach(particle => particle.update());
      this.particles = this.particles.filter(particle => !particle.markedForDeletion);

      //explosion
      this.explosions.forEach(explosion => explosion.update(deltaTime));
      this.explosions = this.explosions.filter(explosion => !explosion.markedForDeletion);

      ////add new enemies to the game////
      this.enemies.forEach(enemy => {
        enemy.update();
        //checking collision of player and enemy
        if (this.checkCollision(this.player, enemy)) {
          enemy.markedForDeletion = true;
          this.addExplosion(enemy)
          //apear particle after collison with player
          for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
          }
          //player power up condition
          if (enemy.type === 'lucky' && !this.player.powerUps) this.player.enterPowerUp();
          else if (!this.gameOver) this.score--;
        }
        //checking collision of ammo and enemy
        this.player.projectiles.forEach(projectile => {
          if (this.checkCollision(enemy, projectile)) {
            //if projectile hit enemy, it reduce enemy lives 1
            //projectile will removes and particle will come out of enemy
            enemy.lives--;
            projectile.markedForDeletion = true;
            this.particles.push(new Particle(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
            //state after enemy destroyed
            if (enemy.lives <= 0) {
              //enemy will removed from game
              enemy.markedForDeletion = true;
              this.addExplosion(enemy)  //explosion effects
              //particle will brust out of the mechanical enemy
              for (let i = 0; i < enemy.lives; i++) {
                this.particles.push(new Particle(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
              }
              //add drone fish after hive whale destruction
              if (enemy.type === 'hiveWhale') {
                for (let i = 0; i < 5; i++) {
                  this.enemies.push(new Drone(this, enemy.x + Math.random() * enemy.width, enemy.y + Math.random() * enemy.height * 0.5))
                }
              }
              //enemy score will added to game total score
              if (!this.gameOver) this.score += enemy.score;
              //winning condition
              if (this.score >= this.winningScore) this.gameOver = true;
              // if (enemy.type === 'lucky') this.timeLimit += 5000
            }
          }
        })
      });

      //remove the enemies that cross boundary
      this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

      //add enemy after a period
      if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
        this.addEnemy();
        this.enemyTimer = 0;
      } else {
        this.enemyTimer += deltaTime;
      }
    }

    //main game draw function
    draw(context) {
      //draw background
      this.background.draw(context);
      //draw player
      this.player.draw(context);
      //draw enemy
      this.enemies.forEach(enemy => {
        enemy.draw(context)
      });
      //draw explosions
      this.explosions.forEach(explosion => {
        explosion.draw(context)
      });
      //draw particles
      this.particles.forEach(particle => particle.draw(context));
      //draw game UI (like: ammo count, score)
      this.ui.draw(context);
      this.background.layer4.draw(context);
    }

    //add new enemy to game
    addEnemy() {
      const randomize = Math.random();
      if (randomize < 0.3) this.enemies.push(new Angler1(this));
      else if (randomize < 0.6) this.enemies.push(new Angler2(this));
      else if (randomize < 0.7) this.enemies.push(new HiveWhale(this));
      else this.enemies.push(new LuckyFish(this));
    }

    addExplosion(enemy) {
      const randomize = Math.random();
      if (randomize < 0.5) {
        this.explosions.push(new SmokeExplosion(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5))
      } else {
        this.explosions.push(new FireExplosion(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5))
      }
    }

    checkCollision(rect1, rect2) {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y
      )
    }
  }

  let lastTime = 0;
  const game = new Game(canvas.width, canvas.height);

  //animation loop
  function animate(timeStamp) {
    let deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.draw(ctx);
    game.update(deltaTime);
    requestAnimationFrame(animate);
  }
  animate(0);
});