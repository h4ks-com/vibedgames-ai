const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreSpan = document.getElementById('finalScore');

let gameInterval;
let spawnInterval;
let isGameRunning = false;
let score = 0;
const maxScore = 50;
const objects = [];

// Canvas size setup
function resizeCanvas() {
  canvas.width = window.innerWidth * 0.75;
  canvas.height = window.innerHeight * 0.75;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Player object
const basket = {
  width: 80,
  height: 15,
  x: 0,
  y: 0,
  speed: 6,
  dx: 0
};
function init() {
  basket.x = (canvas.width - basket.width) / 2;
  basket.y = canvas.height - basket.height - 20;
}

// Controls
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Start game
startBtn.onclick = () => {
  startGame();
};
restartBtn.onclick = () => {
  startGame();
};

function startGame() {
  score = 0;
  updateScore();
  objects.length = 0;
  init();
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOverScreen').classList.add('hidden');
  isGameRunning = true;
  if (gameInterval) clearInterval(gameInterval);
  if (spawnInterval) clearInterval(spawnInterval);
  gameInterval = setInterval(update, 1000 / 60);
  spawnInterval = setInterval(spawnObject, 650);
}

function update() {
  if (!isGameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Move basket
  if (keys['ArrowLeft']) { basket.dx = -basket.speed; }
  else if (keys['ArrowRight']) { basket.dx = basket.speed; }
  else { basket.dx = 0; }
  basket.x += basket.dx;
  // Boundaries
  if (basket.x < 0) basket.x = 0;
  if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;
  // Draw basket with stylized look
  ctx.fillStyle = '#FF6F00';
  ctx.beginPath();
  ctx.moveTo(basket.x, basket.y + basket.height);
  ctx.lineTo(basket.x + 10, basket.y);
  ctx.lineTo(basket.x + basket.width - 10, basket.y);
  ctx.lineTo(basket.x + basket.width, basket.y + basket.height);
  ctx.closePath();
  ctx.fill();
  // Update objects
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    obj.y += obj.speed;
    // Draw objects with realistic textures
    const gradient = ctx.createRadialGradient(obj.x, obj.y, 0, obj.x, obj.y, obj.size / 2);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, obj.color);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.size / 2, 0, Math.PI * 2);
    ctx.fill();
    // Collision detection
    if (
      obj.y + obj.size / 2 >= basket.y &&
      obj.x >= basket.x &&
      obj.x <= basket.x + basket.width
    ) {
      objects.splice(i, 1);
      score++;
      updateScore();
      if (score >= maxScore) {
        endGame();
      }
    } else if (obj.y > canvas.height + obj.size) {
      objects.splice(i, 1);
    }
  }
}

function spawnObject() {
  const sizes = [15, 20, 25];
  const sizeIdx = Math.floor(Math.random() * sizes.length);
  const size = sizes[sizeIdx];
  const x = Math.random() * (canvas.width - size) + size / 2;
  const colors = ['#FFA500', '#FF4500', '#FFD700', '#ADFF2F', '#00CED1'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const speed = 3 + Math.random() * 2;
  objects.push({ x: x, y: -size, size: size, speed: speed, color: color });
}

function updateScore() {
  scoreDisplay.textContent = 'Score: ' + score;
}

function endGame() {
  clearInterval(gameInterval);
  clearInterval(spawnInterval);
  isGameRunning = false;
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOverScreen').classList.remove('hidden');
}

// Initialize
init();