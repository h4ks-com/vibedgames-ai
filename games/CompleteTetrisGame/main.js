const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const nextCanvas = document.getElementById('nextCanvas');
const holdCanvas = document.getElementById('holdCanvas');
const startBtn = document.getElementById('startBtn');
const bgMusic = document.getElementById('bgMusic');

const blockSize = 30;
const columns = 10;
const rows = 20;
canvas.width = columns * blockSize;
canvas.height = rows * blockSize;

let grid = Array.from({ length: rows }, () => Array(columns).fill(0));
let currentPiece = null;
let nextPiece = null;
let holdPiece = null;
let holdUsed = false;
let score = 0;
let level = 1;
let linesCleared = 0;
let dropInterval = 1000;
let lastDropTime = 0;
let gameInterval = null;
let gameRunning = false;
let gamePaused = false;

const shapes = {
  I: [[1, 1, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  T: [[0, 1, 0], [1, 1, 1]],
  Z: [[1, 1, 0], [0, 1, 1]]
};

const colors = {
  0: '#ffffff',
  1: '#ff0000',
  2: '#00ffff',
  3: '#ffff00',
  4: '#ff7f00',
  5: '#800080',
  6: '#00ff00'
};

function getRandomShape() {
  const shapeKeys = Object.keys(shapes);
  const randKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
  return { shape: shapes[randKey], color: colors[Object.keys(shapes).indexOf(randKey) + 1], type: randKey };
}

function createPiece() {
  const { shape, color, type } = getRandomShape();
  return {
    shape,
    color,
    x: Math.floor(columns / 2) - Math.ceil(shape[0].length / 2),
    y: 0,
    type
  };
}

function rotate(matrix) {
  const n = matrix.length;
  const m = matrix[0].length;
  const result = Array.from({ length: m }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      result[j][n - 1 - i] = matrix[i][j];
    }
  }
  return result;
}

function isValidPosition(piece, offsetX = 0, offsetY = 0, testShape = null) {
  const shape = testShape || piece.shape;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const newX = piece.x + x + offsetX;
        const newY = piece.y + y + offsetY;
        if (
          newX < 0 || newX >= columns ||
          newY < 0 || newY >= rows ||
          grid[newY][newX]
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

function lockPiece() {
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (currentPiece.shape[y][x]) {
        grid[currentPiece.y + y][currentPiece.x + x] = Object.keys(colors).indexOf(currentPiece.color);
      }
    }
  }
  clearLines();
  spawnNext();
  holdUsed = false;
}

function spawnNext() {
  if (!nextPiece) {
    nextPiece = createPiece();
  }
  currentPiece = nextPiece;
  nextPiece = createPiece();
  currentPiece.x = Math.floor(columns / 2) - Math.ceil(currentPiece.shape[0].length / 2);
  currentPiece.y = 0;
  if (!isValidPosition(currentPiece)) {
    gameOver();
  }
}

function clearLines() {
  let linesToClear = [];
  for (let y = 0; y < rows; y++) {
    if (grid[y].every(cell => cell !== 0)) {
      linesToClear.push(y);
    }
  }
  if (linesToClear.length > 0) {
    for (const y of linesToClear) {
      grid.splice(y, 1);
      grid.unshift(new Array(columns).fill(0));
    }
    const points = linesToClear.length * 100;
    score += points;
    linesCleared += linesToClear.length;
    if (linesCleared >= level * 10) {
      level++;
      dropInterval = Math.max(100, dropInterval - 100);
    }
    updateScore();
  }
}

function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
  levelEl.textContent = `Level: ${level}`;
  linesEl.textContent = `Lines: ${linesCleared}`;
}

function gameOver() {
  clearInterval(gameInterval);
  gameRunning = false;
  alert('Game Over! Your score: ' + score);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      ctx.fillStyle = colors[grid[y][x]];
      ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
      ctx.strokeStyle = '#222';
      ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
    }
  }
  if (currentPiece) {
    drawPiece(currentPiece);
    drawGhost();
  }
  drawNext();
  drawHold();
}

function drawPiece(piece) {
  ctx.fillStyle = piece.color;
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        ctx.fillRect((piece.x + x) * blockSize, (piece.y + y) * blockSize, blockSize, blockSize);
        ctx.strokeStyle = '#222';
        ctx.strokeRect((piece.x + x) * blockSize, (piece.y + y) * blockSize, blockSize, blockSize);
      }
    }
  }
}

function drawGhost() {
  const ghostY = findDropPosition();
  ctx.globalAlpha = 0.3;
  const ghostPiece = {...currentPiece, y: ghostY};
  drawPiece(ghostPiece);
  ctx.globalAlpha = 1.0;
}

function findDropPosition() {
  let yPos = currentPiece.y;
  while (isValidPosition(currentPiece, 0, yPos - currentPiece.y + 1)) {
    yPos++;
  }
  return yPos;
}

function drawNext() {
  const ctxNext = nextCanvas.getContext('2d');
  ctxNext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = nextPiece.shape;
  const color = nextPiece.color;
  shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        ctxNext.fillStyle = color;
        ctxNext.fillRect(x * blockSize / 2, y * blockSize / 2, blockSize / 2, blockSize / 2);
        ctxNext.strokeStyle = '#222';
        ctxNext.strokeRect(x * blockSize / 2, y * blockSize / 2, blockSize / 2, blockSize / 2);
      }
    });
  });
}

function drawHold() {
  const ctxHold = holdCanvas.getContext('2d');
  ctxHold.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (holdPiece) {
    holdPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          ctxHold.fillStyle = holdPiece.color;
          ctxHold.fillRect(x * blockSize / 2, y * blockSize / 2, blockSize / 2, blockSize / 2);
          ctxHold.strokeStyle = '#222';
          ctxHold.strokeRect(x * blockSize / 2, y * blockSize / 2, blockSize / 2, blockSize / 2);
        }
      });
    });
  }
}

function handleKey(e) {
  if (!gameRunning || gamePaused) return;
  switch (e.key) {
    case 'ArrowLeft':
    case 'a':
      move(-1);
      break;
    case 'ArrowRight':
    case 'd':
      move(1);
      break;
    case 'ArrowDown':
    case 's':
      softDrop();
      break;
    case 'ArrowUp':
    case 'w':
      rotatePiece();
      break;
    case ' ': // space for hard drop
      hardDrop();
      break;
    case 'Shift':
    case 'c': // hold
      holdCurrentPiece();
      break;
    case 'p': // pause
      togglePause();
      break;
  }
}

function move(dir) {
  if (isValidPosition(currentPiece, dir, 0)) {
    currentPiece.x += dir;
  }
}

function softDrop() {
  if (isValidPosition(currentPiece, 0, 1)) {
    currentPiece.y += 1;
  } else {
    lockPiece();
  }
}

function hardDrop() {
  const dropY = findDropPosition();
  currentPiece.y = dropY;
  lockPiece();
}

function rotatePiece() {
  const rotatedShape = rotate(currentPiece.shape);
  if (isValidPosition({...currentPiece, shape: rotatedShape}, 0, 0, rotatedShape)) {
    currentPiece.shape = rotatedShape;
  } else {
    // wall kick logic could be added here
  }
}

function holdCurrentPiece() {
  if (holdUsed) return;
  if (!holdPiece) {
    holdPiece = {...currentPiece};
    spawnNext();
  } else {
    const temp = holdPiece;
    holdPiece = {...currentPiece};
    currentPiece = temp;
    currentPiece.x = Math.floor(columns / 2) - Math.ceil(currentPiece.shape[0].length / 2);
    currentPiece.y = 0;
    if (!isValidPosition(currentPiece)) {
      gameOver();
    }
  }
  holdUsed = true;
  drawHold();
}

function togglePause() {
  if (!gameRunning) return;
  if (gamePaused) {
    gamePaused = false;
    gameInterval = setInterval(update, dropInterval);
  } else {
    gamePaused = true;
    clearInterval(gameInterval);
  }
}

function update(time = 0) {
  if (!lastDropTime) lastDropTime = time;
  const delta = time - lastDropTime;
  if (delta > dropInterval) {
    softDrop();
    lastDropTime = time;
  }
  draw();
}

canvas.addEventListener('keydown', handleKey);
window.addEventListener('keydown', handleKey);
startBtn.addEventListener('click', () => {
  startGame();
});

function startGame() {
  grid = Array.from({ length: rows }, () => Array(columns).fill(0));
  score = 0;
  level = 1;
  linesCleared = 0;
  dropInterval = 1000;
  updateScore();
  spawnNext();
  gameRunning = true;
  gamePaused = false;
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(update, dropInterval);
  bgMusic.play();
}

// Initialize
bgMusic.play(); // Start music
bgMusic.pause(); // Pause initially

// Optional: attach to window to handle focus/blur
window.addEventListener('blur', () => {
  if (gameRunning) bgMusic.pause();
});
window.addEventListener('focus', () => {
  if (gameRunning && !gamePaused) bgMusic.play();
});

// Draw initial
draw();