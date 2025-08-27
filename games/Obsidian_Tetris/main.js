// Define larger grid size and block size
const COLS = 20;
const ROWS = 40;
const blockSize = 30; // Keep block size same, scale grid

// Initialize canvas and context
const canvas = document.createElement('canvas');
document.getElementById('gameContainer').appendChild(canvas);
const ctx = canvas.getContext('2d');

// Colors and aesthetic inspired by obsidian textures
const backgroundColor = '#000'; // Deep black
const gridStrokeColor = '#222'; // Slightly lighter grid lines for depth

// Tetromino shape definitions
const tetrominoes = {
  I: [[1, 1, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  T: [[0, 1, 0], [1, 1, 1]],
  Z: [[1, 1, 0], [0, 1, 1]]
};

// Colors reflecting obsidian hues with crystalline shimmer
const colors = {
  I: "#00f",
  J: "#0000ff",
  L: "#ffa500",
  O: "#ffff00",
  S: "#00ff00",
  T: "#a020f0",
  Z: '#ff0000'
};

// Game state variables
let grid = createGrid(ROWS, COLS);
let currentPiece = null;
let gameInterval = null;
let score = 0;

// Create empty game grid
function createGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

// Resize canvas to fit grid
function resizeCanvas() {
  canvas.width = COLS * blockSize;
  canvas.height = ROWS * blockSize;
}

// Spawn a new tetromino piece
function spawnPiece() {
  const types = Object.keys(tetrominoes);
  const randType = types[Math.floor(Math.random() * types.length)];
  const shape = tetrominoes[randType];
  currentPiece = {
    shape: shape,
    x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
    y: 0,
    color: colors[randType]
  };
  if (collides(grid, currentPiece)) {
    alert('Game Over!');
    clearInterval(gameInterval);
  }
}

// Handle keyboard input
function handleKeyDown(e) {
  switch (e.key) {
    case 'ArrowLeft':
      moveCurrentPiece(-1, 0); break;
    case 'ArrowRight':
      moveCurrentPiece(1, 0); break;
    case 'ArrowDown':
      moveCurrentPiece(0, 1); break;
    case 'ArrowUp':
      rotateCurrentPiece(); break;
  }
}

// Move current piece
function moveCurrentPiece(dx, dy) {
  const newPiece = { ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy };
  if (!collides(grid, newPiece)) {
    currentPiece = newPiece;
  } else if (dy === 1) {
    lockPiece();
  }
}

// Rotate current piece
function rotateCurrentPiece() {
  const rotatedShape = rotateMatrix(currentPiece.shape);
  const newPiece = { ...currentPiece, shape: rotatedShape };
  if (!collides(grid, newPiece)) {
    currentPiece.shape = rotatedShape;
  }
}

// Rotate matrix (shape)
function rotateMatrix(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotated[x][rows - y - 1] = matrix[y][x];
    }
  }
  return rotated;
}

// Check collision of piece with grid boundaries and existing blocks
function collides(grid, piece) {
  const { shape, x, y } = piece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c]) {
        const newX = x + c;
        const newY = y + r;
        if (
          newX < 0 || newX >= COLS ||
          newY >= ROWS ||
          (newY >= 0 && grid[newY][newX])
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// Lock piece into grid
function lockPiece() {
  const { shape, x, y, color } = currentPiece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c]) {
        const gridY = y + r;
        const gridX = x + c;
        if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
          grid[gridY][gridX] = color;
        }
      }
    }
  }
  clearLines();
  spawnPiece();
}

// Clear completed lines
function clearLines() {
  let linesCleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (grid[y].every(cell => cell)) {
      grid.splice(y, 1);
      grid.unshift(new Array(COLS).fill(0));
      linesCleared++;
      y++;
    }
  }
  score += linesCleared * 100;
}

// Main game update loop
function update() {
  moveCurrentPiece(0, 1);
}

// Draw game state
function draw() {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid with subtle textured effect
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.strokeStyle = gridStrokeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
      if (grid[y][x]) {
        // Draw block with gradient for crystalline look
        const gradient = ctx.createLinearGradient(x * blockSize, y * blockSize, x * blockSize, y * blockSize + blockSize);
        gradient.addColorStop(0, grid[y][x]);
        gradient.addColorStop(1, '#000');
        ctx.fillStyle = gradient;
        ctx.fillRect(x * blockSize + 1, y * blockSize + 1, blockSize - 2, blockSize - 2);
      } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(x * blockSize + 1, y * blockSize + 1, blockSize - 2, blockSize - 2);
      }
    }
  }
  // Draw current piece with shading and texture
  const { shape, x, y, color } = currentPiece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c]) {
        const gradient = ctx.createLinearGradient(
          (x + c) * blockSize,
          (y + r) * blockSize,
          (x + c) * blockSize + blockSize,
          (y + r) * blockSize + blockSize
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#000');
        ctx.fillStyle = gradient;
        ctx.fillRect(
          (x + c) * blockSize + 1,
          (y + r) * blockSize + 1,
          blockSize - 2,
          blockSize - 2
        );
      }
    }
  }
  // Draw score
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, 10, 25);
  requestAnimationFrame(draw);
}

// Initialize game
function init() {
  resizeCanvas();
  window.addEventListener('keydown', handleKeyDown);
  spawnPiece();
  gameInterval = setInterval(update, 500); // Adjust speed as needed
}

// Start game loop
init();
draw();