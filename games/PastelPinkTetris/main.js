// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Grid setup
const gridWidth = 10;
const gridHeight = 20;
const cellSize = 30; // size for each block
let grid = Array.from({length: gridHeight}, () => Array(gridWidth).fill(null));

// Score & Level variables, with initial settings
let score = 0;
let level = 1;
let linesCleared = 0;
let fallInterval = 1000;
let lastFallTime = 0;
let gameOver = false;
let gamePaused = false;

// Current and next pieces
let currentPiece = null;
let nextPiece = null;
let holdPiece = null;
let holdUsed = false;

// Shapes of Tetrominoes
const shapes = {
  I: [[1, 1, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  T: [[0, 1, 0], [1, 1, 1]],
  Z: [[1, 1, 0], [0, 1, 1]]
};

// Colors for each shape
const shapeColors = {
  I: '#ffd1dc',
  J: '#ffb6c1',
  L: '#ffa07a',
  O: '#ffe4e1',
  S: '#ff69b4',
  T: '#ff1493',
  Z: '#db7093'
};

// Resize canvas to fit grid
function resize() {
  canvas.width = gridWidth * cellSize;
  canvas.height = gridHeight * cellSize;
}
window.addEventListener('resize', resize);
resize();

// Generate a random shape and create a piece
function generateRandomShape() {
  const keys = Object.keys(shapes);
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return createPiece(randKey);
}

// Create a piece object
function createPiece(name) {
  return {
    shape: shapes[name],
    name: name,
    x: Math.floor(gridWidth / 2) - Math.ceil(shapes[name][0].length / 2),
    y: 0,
    color: shapeColors[name]
  };
}

// Draw everything
function draw() {
  ctx.fillStyle = '#ffe4e1'; // Pastel pink background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid blocks
  for (let y=0; y<gridHeight; y++) {
    for (let x=0; x<gridWidth; x++) {
      if (grid[y][x]) {
        ctx.fillStyle = grid[y][x];
        drawBlockWithTexture(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  // Draw current piece
  if (currentPiece) {
    drawPiece(currentPiece);
  }

  // Draw score & level with cheerful style
  ctx.fillStyle = '#ff69b4';
  ctx.font = '20px "Arial Rounded MT Bold"';
  ctx.fillText(`Score: ${score}`, 10, 25);
  ctx.fillText(`Level: ${level}`, 10, 50);
}

// Draw a textured block with pastel gradient
function drawBlockWithTexture(x, y, width, height) {
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, '#ffd1dc');
  gradient.addColorStop(1, '#ffe4e1');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#ffd1dc';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
}

// Draw a piece
function drawPiece(piece) {
  ctx.fillStyle = piece.color;
  const shape = piece.shape;
  for (let r=0; r<shape.length; r++) {
    for (let c=0; c<shape[r].length; c++) {
      if (shape[r][c]) {
        drawBlockWithTexture((piece.x + c) * cellSize, (piece.y + r) * cellSize, cellSize, cellSize);
      }
    }
  }
}

// Valid position check
function isValidPosition(piece, offsetX=0, offsetY=0, rotatedShape=null) {
  const shape = rotatedShape || piece.shape;
  for (let r=0; r<shape.length; r++) {
    for (let c=0; c<shape[r].length; c++) {
      if (shape[r][c]) {
        const x = piece.x + c + offsetX;
        const y = piece.y + r + offsetY;
        if (x < 0 || x >= gridWidth || y >= gridHeight || (y >= 0 && grid[y][x])) {
          return false;
        }
      }
    }
  }
  return true;
}

// Place current piece into grid
function placePiece() {
  const shape = currentPiece.shape;
  for (let r=0; r<shape.length; r++) {
    for (let c=0; c<shape[r].length; c++) {
      if (shape[r][c]) {
        const x = currentPiece.x + c;
        const y = currentPiece.y + r;
        if (y >= 0 && y < gridHeight && x >= 0 && x < gridWidth) {
          grid[y][x] = currentPiece.color;
        } else if (y < 0) {
          // Game over condition
          gameOver = true;
        }
      }
    }
  }
  clearLines();
  spawnNext();
  holdUsed = false;
}

// Clear completed lines
function clearLines() {
  let lines = 0;
  for (let y=gridHeight-1; y>=0; y--) {
    if (grid[y].every(cell => cell !== null)) {
      grid.splice(y, 1);
      grid.unshift(Array(gridWidth).fill(null));
      lines++;
      y++; // check same row again after removal
    }
  }
  // Update score
  if (lines > 0) {
    const pointsPerLine = {1: 100, 2: 300, 3: 500, 4: 800};
    score += pointsPerLine[lines] || lines * 200;
    linesCleared += lines;
    // Increase level
    if (linesCleared >= level * 10) {
      level++;
      fallInterval = Math.max(200, fallInterval - 100);
    }
  }
}

// Spawn next piece
function spawnNext() {
  currentPiece = nextPiece || generateRandomShape();
  currentPiece.x = Math.floor(gridWidth / 2) - Math.ceil(currentPiece.shape[0].length / 2);
  currentPiece.y = 0;
  nextPiece = generateRandomShape();
}

// Rotate shape
function rotateShape(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const newShape = Array.from({length: cols}, () => Array(rows).fill(0));
  for (let r=0; r<rows; r++) {
    for (let c=0; c<cols; c++) {
      newShape[c][rows - r - 1] = shape[r][c];
    }
  }
  return newShape;
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (gameOver || gamePaused) return;
  if (e.key === 'ArrowLeft') {
    if (isValidPosition(currentPiece, -1, 0)) currentPiece.x -= 1;
  } else if (e.key === 'ArrowRight') {
    if (isValidPosition(currentPiece, 1, 0)) currentPiece.x += 1;
  } else if (e.key === 'ArrowDown') {
    if (isValidPosition(currentPiece, 0, 1)) currentPiece.y += 1;
  } else if (e.key === 'ArrowUp') {
    const rotatedShape = rotateShape(currentPiece.shape);
    if (isValidPosition(currentPiece, 0, 0, rotatedShape)) {
      currentPiece.shape = rotatedShape;
    }
  } else if (e.key === 'c' || e.key === 'C') {
    hold();
  } else if (e.key === ' ' || e.key === 'Enter') {
    hardDrop();
  } else if (e.key === 'p' || e.key === 'P') {
    togglePause();
  }
});

// Hold piece
function hold() {
  if (holdUsed) return;
  if (!holdPiece) {
    holdPiece = createPiece(currentPiece.name);
    spawnNext();
  } else {
    const temp = holdPiece;
    holdPiece = createPiece(currentPiece.name);
    currentPiece = temp;
    currentPiece.x = Math.floor(gridWidth / 2) - Math.ceil(currentPiece.shape[0].length/2);
    currentPiece.y = 0;
  }
  holdUsed = true;
}

// Hard drop
function hardDrop() {
  while (isValidPosition(currentPiece, 0, 1)) {
    currentPiece.y += 1;
  }
  placePiece();
}

// Main game loop
let lastTime = performance.now();
function gameLoop(currentTime) {
  if (gameOver || gamePaused) {
    lastTime = currentTime;
    requestAnimationFrame(gameLoop);
    return;
  }
  if (!lastTime) lastTime = currentTime;
  const delta = currentTime - lastTime;
  if (delta >= fallInterval) {
    if (isValidPosition(currentPiece, 0, 1)) {
      currentPiece.y += 1;
    } else {
      placePiece();
    }
    lastTime = currentTime;
  }
  draw();
  requestAnimationFrame(gameLoop);
}

// Initialize game state
function startGame() {
  grid = Array.from({length: gridHeight}, () => Array(gridWidth).fill(null));
  score = 0;
  level = 1;
  linesCleared = 0;
  fallInterval = 1000;
  gameOver = false;
  currentPiece = null;
  nextPiece = null;
  holdPiece = null;
  holdUsed = false;
  gamePaused = false;
  spawnNext();
  requestAnimationFrame(gameLoop);
}

// Toggle pause
function togglePause() {
  gamePaused = !gamePaused;
  if (!gamePaused) {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

// Start game on load
startGame();