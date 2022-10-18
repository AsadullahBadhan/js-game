window.addEventListener('load', function () {
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.width = 1500;
  canvas.height = 500;

  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener('keydown', e => {
        if ((
          (e.key === 'ArrowUp') ||
          (e.key === 'ArrowDown')
        ) &&
          (this.game.keys.indexOf(e.key) === -1)) {
          this.game.keys.push(e.key);
        }
        else if (e.key === ' ') {
          this.game.player.shootTop();
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
      this.speedY = 0;
      this.maxSpeed = 3;
      this.projectiles = [];
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
      //handle projectiles
      this.projectiles.forEach(projectile => {
        projectile.update();
      });
      this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
    }
    draw(context) {
      context.fillStyle = 'black';
      context.fillRect(this.x, this.y, this.width, this.height);
      //draw projectile
      this.projectiles.forEach(projectile => {
        projectile.draw(context);
      });
    }
    shootTop() {
      if (this.game.ammo > 0) {
        this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 20))
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
      this.lives = 5;
      this.score = this.lives;
      this.died = [];
    }
    update() {
      this.x += this.speedX;
      if (this.x + this.width < 0) this.markedForDeletion = true;
    }
    draw(context) {
      context.fillStyle = 'red';
      context.fillRect(this.x, this.y, this.width, this.height);
      context.fillStyle = 'black';
      context.font = '20px Helvetica'
      context.fillText(this.lives, this.x, this.y);
    }
  }

  class Angler1 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 229 * 0.2;
      this.height = 169 * 0.2;
      this.y = Math.random() * (this.game.height * 0.9 - this.height);
    }
  }

  class Layer { }

  class Background { }

  class UI {
    constructor(game) {
      this.game = game;
      this.fontSize = 25;
      this.fontFamily = 'Helvetica';
      this.color = 'yellow'
    }
    draw(context) {
      for (let i = 0; i < this.game.ammo; i++) {
        context.fillStyle = this.color;
        context.fillRect(20 + 7 * i, 50, 3, 20);
      }
    }
  }

  //the main game class
  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
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
      this.gameOver = false;
    }
    update(deltaTime) {
      this.player.update();

      //recharg ammo after a period of time
      if (this.ammoTimer > this.ammoInterval) {
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
              this.score += enemy.score;
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
      //draw player
      this.player.draw(context);
      //draw game UI (like: ammo count, score)
      this.ui.draw(context);
      //draw enemy
      this.enemies.forEach(enemy => {
        enemy.draw(context)
      });
    }
    addEnemy() {
      this.enemies.push(new Angler1(this));
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