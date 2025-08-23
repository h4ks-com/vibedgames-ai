const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const endTurnBtn = document.getElementById('endTurnBtn');
const statusDiv = document.getElementById('status');

const width = 800;
const height = 400;
canvas.width = width;
canvas.height = height;

let terrain = [];
const terrainWidth = width;
const terrainHeight = height / 2;

function generateTerrain() {
  terrain = [];
  for (let x = 0; x < terrainWidth; x++) {
    const y = Math.floor((Math.sin(x/50) * 20 + Math.sin(x/20) * 10) + terrainHeight);
    terrain[x] = y;
  }
}

function drawTerrain() {
  ctx.fillStyle = '#654321';
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x < terrain.length; x++) {
    ctx.lineTo(x, terrain[x]);
  }
  ctx.lineTo(terrain.length, height);
  ctx.closePath();
  ctx.fill();
}

class Worm {
  constructor(x, color, name) {
    this.x = x;
    this.y = terrain[x] - 1;
    this.health = 100;
    this.width = 20;
    this.height = 20;
    this.color = color;
    this.name = name;
    this.angle = Math.PI / 4;
    this.power = 50;
    this.alive = true;
  }
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.width/2, this.y - this.height, this.width, this.height);
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x - 15, this.y - this.height - 10, 30, 3);
    ctx.fillStyle = 'green';
    ctx.fillRect(this.x - 15, this.y - this.height - 10, 30 * (this.health/100), 3);
  }
  get position() {
    return { x: this.x, y: this.y };
  }
}

let worms = [];
let currentPlayerIndex = 0;
let currentWorm;
let isShooting = false;
let projectiles = [];

generateTerrain();
worms.push(new Worm(100, 'yellow', 'Player 1'));
worms.push(new Worm(700, 'orange', 'Player 2'));

function getAliveWorms() {
  return worms.filter(w => w.alive);
}

function nextTurn() {
  let aliveWorms = getAliveWorms();
  if (aliveWorms.length <= 1) {
    statusDiv.innerText = `Game Over! Winner: ${aliveWorms[0].name}`;
    return;
  }
  currentPlayerIndex = (currentPlayerIndex + 1) % worms.length;
  currentWorm = worms[currentPlayerIndex];
  while (!currentWorm.alive) {
    currentPlayerIndex = (currentPlayerIndex + 1) % worms.length;
    currentWorm = worms[currentPlayerIndex];
  }
  statusDiv.innerText = `${currentWorm.name}'s turn`;
  currentWorm.angle = Math.PI / 4;
  currentWorm.power = 50;
  updateUI();
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  drawTerrain();
  worms.forEach(w => { if (w.alive) w.draw(); });
  projectiles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function terrainAt(x) {
  if (x < 0 || x >= terrain.length) return height;
  return terrain[Math.floor(x)];
}

function shoot() {
  if (isShooting) return;
  isShooting = true;
  const angle = currentWorm.angle;
  const power = currentWorm.power;
  const startX = currentWorm.x;
  const startY = currentWorm.y - currentWorm.height;
  const vx = Math.cos(angle) * power * 0.1;
  const vy = Math.sin(angle) * -power * 0.1;

  const projectile = { x: startX, y: startY, vx: vx, vy: vy, color: currentWorm.color };
  projectiles.push(projectile);
  animateProjectile(projectile);
}

function animateProjectile(p) {
  const gravity = 0.2;
  const interval = setInterval(() => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += gravity;
    if (p.x < 0 || p.x >= width || p.y >= terrainAt(p.x)) {
      clearInterval(interval);
      explode(p.x, p.y);
      projectiles = projectiles.filter(pp => pp !== p);
      isShooting = false;
      nextTurn();
      draw();
    } else {
      draw();
    }
  }, 30);
}

function explode(x, y) {
  ctx.fillStyle = 'orange';
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.fill();
  const radius = 20;
  for (let xx = Math.max(0, x - radius); xx <= Math.min(width - 1, x + radius); xx++) {
    if (Math.abs(xx - x) < radius) {
      const dy = Math.sqrt(radius * radius - (xx - x) * (xx - x));
      const minY = Math.max(0, Math.floor(y - dy));
      const maxY = Math.min(height, Math.ceil(y + dy));
      for (let yy = minY; yy <= maxY; yy++) {
        const index = Math.floor(xx);
        if (terrain[index] && terrain[index] > yy) {
          terrain[index] = yy;
        }
      }
    }
  }
  checkWormDamage(x, y);
  draw();
}

function checkWormDamage(x, y) {
  worms.forEach(w => {
    if (w.alive) {
      const dx = w.x - x;
      const dy = w.y - y;
      if (Math.sqrt(dx*dx + dy*dy) < 15) {
        w.health -= 50;
        if (w.health <= 0) {
          w.alive = false;
        }
      }
    }
  });
}

function updateUI() {
  document.getElementById('weaponInfo').innerText = `Angle: ${(currentWorm.angle * 180/Math.PI).toFixed(1)}°, Power: ${currentWorm.power}`;
}

canvas.addEventListener('keydown', (e) => {
  if (!currentWorm || !currentWorm.alive || isShooting) return;
  if (e.key === 'ArrowLeft') {
    currentWorm.angle -= 0.05;
    if (currentWorm.angle < 0) currentWorm.angle = 0;
  } else if (e.key === 'ArrowRight') {
    currentWorm.angle += 0.05;
    if (currentWorm.angle > Math.PI/2) currentWorm.angle = Math.PI/2;
  } else if (e.key === 'ArrowUp') {
    currentWorm.power += 5;
    if (currentWorm.power > 100) currentWorm.power = 100;
  } else if (e.key === 'ArrowDown') {
    currentWorm.power -= 5;
    if (currentWorm.power < 10) currentWorm.power = 10;
  } else if (e.key === ' ') {
    shoot();
  }
  updateUI();
});

document.getElementById('endTurnBtn').addEventListener('click', () => {
  nextTurn();
  draw();
});

nextTurn();
draw();
updateUI();

// Focus canvas for keyboard control
canvas.setAttribute('tabindex','0');
canvas.focus();