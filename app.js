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
    }
    update() {
      this.x += this.speed;
      if (this.x > this.game.width * 0.9) this.markedForDeletion = true;
    }
    draw(context) {
      context.fillStyle = 'yellow';
      context.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  class Particle { }

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
    }
    update() {
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
    }
    draw(context) {
      if (this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height)
      context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
      //draw projectile
      this.projectiles.forEach(projectile => {
        projectile.draw(context);
      });
    }
    shootTop() {
      if (this.game.ammo > 0) {
        this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 30))
        this.game.ammo--;
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
      if (this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
      context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
      context.fillStyle = 'black';
      context.font = '20px Helvetica'
      context.fillText(this.lives, this.x, this.y - 5);
    }
  }

  class Angler1 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 228;
      this.height = 169;
      this.y = Math.random() * (this.game.height * 0.9 - this.height);
      this.image = document.getElementById('angler1');
      this.frameY = Math.floor(Math.random() * 3);
      this.lives = 2;
      this.score = this.lives;
    }
  }

  class Angler2 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 213;
      this.height = 169;
      this.y = Math.random() * (this.game.height * 0.9 - this.height);
      this.image = document.getElementById('angler2');
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 3;
      this.score = this.lives;
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
      //ammo
      for (let i = 0; i < this.game.ammo; i++) {
        context.fillRect(20 + 7 * i, 50, 3, 20);
      }

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
        context.fillText(message2, canvas.width / 2, canvas.height / 2 + 30);
        context.font = `50px ${this.fontFamily}`
        context.fillText(message1, canvas.width / 2, canvas.height / 2 - 30);
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
      this.enemyTimer = 0;
      this.enemyInterval = 1000;
      this.ui = new UI(this);
      this.ammo = 20;
      this.maxAmmo = 50;
      this.ammoTimer = 0;
      this.ammoInterval = 500;
      this.score = 0;
      this.winningScore = 10;
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
      this.player.update();

      //recharg ammo after a period of time
      if (this.ammoTimer > this.ammoInterval && !this.gameOver) {
        if (this.ammo < this.maxAmmo) this.ammo++;
        this.ammoTimer = 0;
      } else {
        this.ammoTimer += deltaTime;
      }

      ////add new enemies to the game////
      this.enemies.forEach(enemy => {
        enemy.update();
        //checking collision of ammo and enemy
        if (this.checkCollision(this.player, enemy)) {
          enemy.markedForDeletion = true;
        }
        this.player.projectiles.forEach(projectile => {
          if (this.checkCollision(enemy, projectile)) {
            enemy.lives--;
            projectile.markedForDeletion = true;
            if (enemy.lives <= 0) {
              enemy.markedForDeletion = true;
              if (!this.gameOver) this.score += enemy.score;
              //winning condition
              if (this.score >= this.winningScore) this.gameOver = true;
            }
          }
        })
      });

      //filter out the enemies that cross boundary
      this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

      //add enemy after a period
      if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
        this.addEnemy();
        this.enemyTimer = 0;
      } else {
        this.enemyTimer += deltaTime;
      }
    }
    draw(context) {
      //draw background
      this.background.draw(context);
      //draw player
      this.player.draw(context);
      //draw enemy
      this.enemies.forEach(enemy => {
        enemy.draw(context)
      });
      //draw game UI (like: ammo count, score)
      this.ui.draw(context);
      this.background.layer4.draw(context);
    }

    //add new enemy to game
    addEnemy() {
      const randomize = Math.random();
      if (randomize < 0.5) this.enemies.push(new Angler1(this));
      else this.enemies.push(new Angler2(this));
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
    game.update(deltaTime);
    game.draw(ctx);
    requestAnimationFrame(animate);
  }
  animate(0);
});