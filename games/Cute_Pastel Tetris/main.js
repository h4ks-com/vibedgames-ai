// Core mechanics for charming pastel Tetris
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const pauseBtn = document.getElementById('pauseBtn');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');
const homeBtn = document.getElementById('homeBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const retryBtn = document.getElementById('retryBtn');
const mainMenuBtn = document.getElementById('mainMenuBtn');

// Size setup
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// Color palette with softer pastel shades for enhanced visual charm
const pastelColors = {
  I: '#FFB6C1',
  J: '#ADD8E6',
  L: '#FF69B4',
  O: '#FF1493',
  S: '#FFC0CB',
  T: '#FF69B4',
  Z: '#FFB6C1',
  empty: '#F8F8F8'
};

// Tetromino shapes with rounded edges simulated via CSS shadows in drawing
const SHAPES = {
  I: [[1,1,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]],
  O: [[1,1],[1,1]],
  S: [[0,1,1],[1,1,0]],
  T: [[0,1,0],[1,1,1]],
  Z: [[1,1,0],[0,1,1]]
};

let grid = [];
let currentTetromino = null;
let gameInterval = null;
let score = 0;
let level = 1;
let totalLines = 0;
let dropSpeed = 500;
let gamePaused = false;

// Initialize grid with a textured pastel background simulation
function initGrid() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill('empty'));
}

// Draw grid with textured pastel colors and rounded block appearance
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r=0; r<ROWS; r++) {
    for (let c=0; c<COLS; c++) {
      ctx.fillStyle = pastelColors[grid[r][c]] || pastelColors['empty'];
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.fillRoundRect(c*BLOCK_SIZE+2, r*BLOCK_SIZE+2, BLOCK_SIZE-4, BLOCK_SIZE-4, 8);
      ctx.strokeRoundRect(c*BLOCK_SIZE+2, r*BLOCK_SIZE+2, BLOCK_SIZE-4, BLOCK_SIZE-4, 8);
    }
  }
}

// Extend CanvasRenderingContext2D to include rounded rectangle functions
CanvasRenderingContext2D.prototype.fillRoundRect = function(x, y, width, height, radius) {
  this.beginPath();
  this.moveTo(x + radius, y);
  this.lineTo(x + width - radius, y);
  this.quadraticCurveTo(x + width, y, x + width, y + radius);
  this.lineTo(x + width, y + height - radius);
  this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  this.lineTo(x + radius, y + height);
  this.quadraticCurveTo(x, y + height, x, y + height - radius);
  this.lineTo(x, y + radius);
  this.quadraticCurveTo(x, y, x + radius, y);
  this.closePath();
  this.fill();
};

CanvasRenderingContext2D.prototype.strokeRoundRect = function(x, y, width, height, radius) {
  this.beginPath();
  this.moveTo(x + radius, y);
  this.lineTo(x + width - radius, y);
  this.quadraticCurveTo(x + width, y, x + width, y + radius);
  this.lineTo(x + width, y + height - radius);
  this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  this.lineTo(x + radius, y + height);
  this.quadraticCurveTo(x, y + height, x, y + height - radius);
  this.lineTo(x, y + radius);
  this.quadraticCurveTo(x, y, x + radius, y);
  this.closePath();
  this.stroke();
};

// Create new tetromino with pastel color and rounded look
function spawnTetromino() {
  const keys = Object.keys(SHAPES);
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return {
    shape: SHAPES[randKey],
    color: randKey,
    x: Math.floor(COLS/2) - Math.ceil(SHAPES[randKey][0].length/2),
    y: 0
  };
}

// Draw current tetromino with soft glow for charm
function drawTetromino() {
  ctx.fillStyle = pastelColors[currentTetromino.color];
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 8;
  const shape = currentTetromino.shape;
  for (let r=0; r<shape.length; r++) {
    for (let c=0; c<shape[r].length; c++) {
      if (shape[r][c]) {
        ctx.fillRoundRect(
          (currentTetromino.x + c) * BLOCK_SIZE + 2,
          (currentTetromino.y + r) * BLOCK_SIZE + 2,
          BLOCK_SIZE - 4,
          BLOCK_SIZE - 4,
          8
        );
      }
    }
  }
  ctx.shadowBlur = 0;
}

// Collision detection
function checkCollision(dx, dy, shape) {
  for (let r=0; r<shape.length; r++) {
    for (let c=0; c<shape[r].length; c++) {
      if (shape[r][c]) {
        const newX = currentTetromino.x + c + dx;
        const newY = currentTetromino.y + r + dy;
        if (
          newX < 0 || newX >= COLS ||
          newY >= ROWS ||
          (newY >= 0 && grid[newY][newX] !== 'empty')
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// Lock tetromino into grid
function lockTetromino() {
  const shape = currentTetromino.shape;
  for (let r=0; r<shape.length; r++) {
    for (let c=0; c<shape[r].length; c++) {
      if (shape[r][c]) {
        const x = currentTetromino.x + c;
        const y = currentTetromino.y + r;
        if (y>=0 && y<ROWS && x>=0 && x<COLS) {
          grid[y][x] = currentTetromino.color;
        }
      }
    }
  }
  checkAndClearLines();
  spawnNextTetromino();
}

// Check for completed lines and clear with animated sparkle effect
function checkAndClearLines() {
  let linesToClear = [];
  for (let r=0; r<ROWS; r++) {
    if (grid[r].every(cell => cell !== 'empty')) {
      linesToClear.push(r);
    }
  }
  if (linesToClear.length > 0) {
    animateLineClear(linesToClear);
    for (const r of linesToClear) {
      for (let c=0; c<COLS; c++) {
        grid[r][c] = 'empty';
      }
    }
    for (let r=linesToClear[linesToClear.length -1]; r>=0; r--) {
      if (!linesToClear.includes(r)) {
        const above = r - linesToClear.length;
        if (above >= 0) {
          grid[r] = [...grid[above]];
        }
      }
    }
    for (let r=0; r<linesToClear.length; r++) {
      grid[r] = Array(COLS).fill('empty');
    }
    score += linesToClear.length * 100;
    totalLines += linesToClear.length;
    if (totalLines >= level * 10) {
      level++;
      adjustSpeed();
    }
    updateUI();
  }
}

// Animate line clear with sparkling stars around
function animateLineClear(lines) {
  const sparkleCount = 15;
  const stars = [];
  for (let i=0; i<sparkleCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 2,
      color: '#ffe6f0',
      dx: (Math.random() - 0.5) * 4,
      dy: (Math.random() - 0.5) * 4
    });
  }
  let frame = 0;
  function drawSparkles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    drawGrid();
    drawTetromino();
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = star.color;
      ctx.fill();

      star.x += star.dx;
      star.y += star.dy;
      star.size *= 0.96;
    });
    frame++;
    if (frame < 15) {
      requestAnimationFrame(drawSparkles);
    }
  }
  drawSparkles();
}

// Spawn next tetromino
function spawnNextTetromino() {
  currentTetromino = spawnTetromino();
  if (checkCollision(0, 0, currentTetromino.shape)) {
    endGame();
  }
}

// Rotate tetromino with wall kicks
function rotateTetromino() {
  const shape = currentTetromino.shape;
  const rotated = shape[0].map((_, i) => shape.map(row => row[i])).reverse();
  if (!checkCollision(0, 0, rotated)) {
    currentTetromino.shape = rotated;
  } else {
    if (!checkCollision(1, 0, rotated)) {
      currentTetromino.x += 1;
      currentTetromino.shape = rotated;
    } else if (!checkCollision(-1, 0, rotated)) {
      currentTetromino.x -= 1;
      currentTetromino.shape = rotated;
    }
  }
}

// Move horizontally
function moveX(dx) {
  if (!checkCollision(dx, 0, currentTetromino.shape)) {
    currentTetromino.x += dx;
  }
}

// Soft drop
function softDrop() {
  if (!checkCollision(0, 1, currentTetromino.shape)) {
    currentTetromino.y += 1;
  } else {
    lockTetromino();
  }
}

// Adjust speed with level
function adjustSpeed() {
  dropSpeed = Math.max(100, 500 - (level - 1) * 50);
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameTick, dropSpeed);
}

// End game
function endGame() {
  clearInterval(gameInterval);
  document.getElementById('gameOverOverlay').classList.remove('hidden');
}

// Update UI elements
function updateUI() {
  scoreEl.textContent = "Score: " + score;
  levelEl.textContent = "Level: " + level;
  linesEl.textContent = "Lines: " + totalLines;
}

// Main game loop
function gameTick() {
  if (!document.getElementById('pauseOverlay').classList.contains('hidden')) return;
  softDrop();
  drawAll();
}

// Draw everything
function drawAll() {
  drawGrid();
  drawTetromino();
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!document.getElementById('pauseOverlay').classList.contains('hidden')) return;
  switch (e.key) {
    case 'ArrowLeft': moveX(-1); break;
    case 'ArrowRight': moveX(1); break;
    case 'ArrowDown': softDrop(); break;
    case 'ArrowUp': rotateTetromino(); break;
  }
  drawAll();
});

// Button event listeners
pauseBtn.addEventListener('click', () => {
  document.getElementById('pauseOverlay').classList.remove('hidden');
});

resumeBtn.addEventListener('click', () => {
  document.getElementById('pauseOverlay').classList.add('hidden');
});

restartBtn.addEventListener('click', () => {
  startGame();
  document.getElementById('pauseOverlay').classList.add('hidden');
});

homeBtn.addEventListener('click', () => {
  startGame();
  document.getElementById('pauseOverlay').classList.add('hidden');
});

retryBtn.addEventListener('click', () => {
  startGame();
  document.getElementById('gameOverOverlay').classList.add('hidden');
});

mainMenuBtn.addEventListener('click', () => {
  startGame();
  document.getElementById('gameOverOverlay').classList.add('hidden');
});

// Start game
function startGame() {
  initGrid();
  score=0; level=1; totalLines=0;
  updateUI();
  spawnNextTetromino();
  adjustSpeed();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameTick, dropSpeed);
  document.getElementById('gameOverOverlay').classList.add('hidden');
}

// Initialize
startGame();