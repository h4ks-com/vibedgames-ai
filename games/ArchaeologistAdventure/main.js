// Main game script for Archaeologist Adventure
// Initialize canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.8;

// Game variables
let keys = {};
let gameObjects = [];
let player = null;
let gameRunning = true;

// Player class
class Player {
  constructor() {
    this.x = 50;
    this.y = 0;
    this.width = 40;
    this.height = 60;
    this.velX = 0;
    this.velY = 0;
    this.speed = 4;
    this.jumping = false;
    this.health = 100;
    this.ammo = 30;
    this.onGround = false;
  }

  update() {
    // Movement
    if (keys['ArrowLeft'] || keys['a']) {
      this.velX = -this.speed;
    } else if (keys['ArrowRight'] || keys['d']) {
      this.velX = this.speed;
    } else {
      this.velX = 0;
    }

    // Jump
    if ((keys['ArrowUp'] || keys['w']) && !this.jumping && this.onGround) {
      this.velY = -12;
      this.jumping = true;
      this.onGround = false;
    }

    // Gravity
    this.velY += 0.5;

    // Position update
    this.x += this.velX;
    this.y += this.velY;

    // Boundary checks
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    if (this.y + this.height > canvas.height) {
      this.y = canvas.height - this.height;
      this.velY = 0;
      this.jumping = false;
      this.onGround = true;
    }

    this.draw();
  }

  draw() {
    ctx.fillStyle = 'sienna';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Platform class
class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw() {
    ctx.fillStyle = 'darkgreen';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Game object class (items, enemies, etc.)
class GameObject {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // e.g., 'artifact', 'enemy'
    this.collected = false;
  }

  draw() {
    if (this.type === 'artifact') {
      ctx.fillStyle = 'gold';
    } else if (this.type === 'enemy') {
      ctx.fillStyle = 'red';
    } else {
      ctx.fillStyle = 'gray';
    }
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Initialize game objects
function init() {
  player = new Player();

  // Create platforms
  gameObjects = [
    ...[new Platform(0, canvas.height - 20, canvas.width, 20)], // ground
    new Platform(100, 400, 100, 10),
    new Platform(300, 350, 100, 10),
    new Platform(500, 300, 100, 10),
    new Platform(700, 250, 100, 10),
  ];

  // Create artifacts and enemies
  gameObjects.push(new GameObject(150, 370, 20, 20, 'artifact'));
  gameObjects.push(new GameObject(350, 320, 20, 20, 'artifact'));
  gameObjects.push(new GameObject(550, 270, 20, 20, 'artifact'));
  gameObjects.push(new GameObject(650, 220, 30, 30, 'enemy'));
}

// Keyboard events
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// Main game loop
function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw and check collision for platforms
  for (let obj of gameObjects) {
    if (obj instanceof Platform) {
      obj.draw();
    }
  }

  // Update player
  player.update();

  // Check collisions with platforms
  player.onGround = false;
  for (let obj of gameObjects) {
    if (obj instanceof Platform) {
      if (
        player.x < obj.x + obj.width &&
        player.x + player.width > obj.x &&
        player.y < obj.y + obj.height &&
        player.y + player.height > obj.y
      ) {
        // Collision detected
        if (player.velY > 0) {
          player.y = obj.y - player.height;
          player.velY = 0;
          player.onGround = true;
        }
      }
    }
  }

  // Check for collectible objects
  for (let obj of gameObjects) {
    if ((obj.type === 'artifact' || obj.type === 'enemy') && !obj.collected) {
      if (
        player.x < obj.x + obj.width &&
        player.x + player.width > obj.x &&
        player.y < obj.y + obj.height &&
        player.y + player.height > obj.y
      ) {
        if (obj.type === 'artifact') {
          obj.collected = true;
          // Update objective text or score
          document.getElementById('objective').innerText += ' - Artifact Collected';
        } else if (obj.type === 'enemy') {
          // Take damage
          player.health -= 20;
          document.getElementById('health').innerText = 'Health: ' + player.health;
          if (player.health <= 0) {
            alert("Game Over! You lost all health.");
            gameRunning = false;
          }
        }
      }
    }
  }

  requestAnimationFrame(gameLoop);
}

// Initialize game
init();
gameLoop();

// Responsive resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.8;
});