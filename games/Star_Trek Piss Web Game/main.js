const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Player properties with improved visuals
const player = {
  x: 50,
  y: 500,
  width: 60,
  height: 80,
  color: 'blue', // Using solid color since gradients can't be directly applied in canvas
  sprite: null,
  speed: 5,
  dx: 0
};

// Load player sprite for proper look
const playerImg = new Image();
playerImg.src = 'https://i.imgur.com/8aXz7p9.png'; // Placeholder astronaut image

// Space objects with textures, incorporate humorous or satirical elements
const objects = [];

// Create alien ships and planets with textures, colors, and humorous labels
for (let i = 0; i < 5; i++) {
  objects.push({
    x: Math.random() * 700 + 50,
    y: Math.random() * 300 + 150,
    width: 50,
    height: 30,
    color: '#1E90FF', // Solid color, replacing gradient
    type: 'alien ship',
    label: 'UFO ' + (i + 1),
    sprite: null
  });
}

// Load sprites for objects
const ufoSprite = new Image();
ufoSprite.src = 'https://i.imgur.com/5G9LPdN.png'; // UFO sprite

// Handle keyboard input for spaceship movement
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    player.dx = player.speed;
  } else if (e.key === 'ArrowLeft') {
    player.dx = -player.speed;
  }
});
document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    player.dx = 0;
  }
});

// Draw space background with humorous twist
const background = new Image();
background.src = 'https://i.imgur.com/IOYwD1d.jpg'; // Space background with humor

// Draw planets with exaggerated features
const planetImg = new Image();
planetImg.src = 'https://i.imgur.com/7p3kU6E.png'; // Planet image

// Update game state
function update() {
  player.x += player.dx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > 800) player.x = 800 - player.width;
}

// Draw game elements with improvements
function draw() {
  ctx.drawImage(background, 0, 0, 800, 600);
  // Draw stars with animated twinkle
  ctx.fillStyle = 'white';
  for (let i=0; i<50; i++) {
    ctx.globalAlpha = Math.random();
    ctx.fillRect(Math.random() * 800, Math.random() * 600, 2, 2);
  }
  ctx.globalAlpha = 1;

  // Draw player sprite
  ctx.drawImage(playerImg, player.x, player.y - 10, player.width, player.height);
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.fillText('Captain Piss', player.x, player.y - 15);

  // Draw objects
  objects.forEach(obj => {
    ctx.save();
    if (obj.label.startsWith('UFO')) {
      ctx.drawImage(ufoSprite, obj.x, obj.y, obj.width, obj.height);
    } else {
      ctx.fillStyle = '#00BFFF';
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    }
    ctx.fillStyle = '#FFFF00';
    ctx.font = '12px Comic Sans MS';
    ctx.fillText(obj.label, obj.x + 3, obj.y + obj.height + 12);
    ctx.restore();
  });
  // Draw planets
  ctx.drawImage(planetImg, 650, 50, 100, 100);
}

// Main game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Load assets and start game when ready
const assets = [playerImg, ufoSprite, background, planetImg];
let assetsLoaded = 0;
assets.forEach(asset => {
  asset.onload = () => {
    assetsLoaded++;
    if (assetsLoaded === assets.length) {
      gameLoop();
    }
  };
});