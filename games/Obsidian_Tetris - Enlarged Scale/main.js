const COLS = 20; // Increased columns for larger grid
const ROWS = 40; // Increased rows for larger grid
const BLOCK_SIZE = 50; // Larger block size for better visual impact

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fit enlarged grid
function resizeCanvas() {
  canvas.width = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;
}

// Colors with textured obsidian appearance
const COLORS = {
  I: '#6B0000', // Darker obsidian hues
  J: '#2E2E2E', // Deep gray for textures
  L: '#6B0000',
  O: '#2E2E2E',
  S: '#6B0000',
  T: '#2E2E2E',
  Z: '#6B0000'
};

// Tetromino shapes with more detailed visuals
const TETROMINOES = {
  I: [[1, 1, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  T: [[0, 1, 0], [1, 1, 1]],
  Z: [[1, 1, 0], [0, 1, 1]]
};

let grid = [];
let currentPiece = null;
let score = 0;

// Initialize game
function init() {
  resizeCanvas();
  createGrid();
  spawnPiece();
  document.addEventListener('keydown', handleKeyDown);
  clearInterval(gameInterval);
  var gameInterval = setInterval(update, 300); // Increased speed for larger grid
  requestAnimationFrame(draw);
}

// Build empty grid with textured background
function createGrid() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(''));
}

// Spawn new piece with more detailed colors
function spawnPiece() {
  const types = Object.keys(TETROMINOES);
  const rand = Math.floor(Math.random() * types.length);
  const type = types[rand];
  currentPiece = {
    shape: TETROMINOES[type],
    x: Math.floor(COLS / 2) - Math.ceil(TETROMINOES[type][0].length / 2),
    y: 0,
    color: COLORS[type]
  };
  if (collides(currentPiece)) {
    alert('Game Over!');
    clearInterval(gameInterval);
  }
}

// Handle key input
function handleKeyDown(e) {
  const { x, y, shape, color } } = currentPiece;
  if (e.key === 'ArrowLeft') {
    const newX = x - 1;
    if (!collides({ ...currentPiece, x: newX })) currentPiece.x = newX;
  } else if (e.key === 'ArrowRight') {
    const newX = x + 1;
    if (!collides({ ...currentPiece, x: newX })) currentPiece.x = newX;
  } else if (e.key === 'ArrowDown') {
    const newY = y + 1;
    if (!collides({ ...currentPiece, y: newY })) currentPiece.y = newY;
  } else if (e.key === 'ArrowUp') {
    rotatePiece();
  }
}

// Rotate piece with visual enhancement
function rotatePiece() {
  const { shape, x, y, color } } = currentPiece;
  const rotatedShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
  if (!collides({ shape: rotatedShape, x, y, color })) {
    currentPiece.shape = rotatedShape;
  }
}

// Check collision
function collides(piece) {
  const { shape, x, y } } = piece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c]) {
        const newX = x + c;
        const newY = y + r;
        if (
          newX < 0 ||
          newX >= COLS ||
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

// Lock piece into grid with textured style
function lockPiece() {
  const { shape, x, y, color } } = currentPiece;
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
  for (let y = ROWS - 1; y >= 0; y--) {
    if (grid[y].every(cell => cell !== '')) {
      grid.splice(y, 1);
      grid.unshift(new Array(COLS).fill(''));
      score += 100;
    }
  }
}

// Update game logic
function update() {
  const { x, y } } = currentPiece;
  const newY = y + 1;
  if (!collides({ ...currentPiece, y: newY })) {
    currentPiece.y = newY;
  } else {
    lockPiece();
  }
}

// Draw game with textured and colorful grid
function draw() {
  ctx.fillStyle = '#1a1a1a'; // Dark textured background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw grid and settled blocks with textures
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.strokeStyle = '#555';
      ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      if (grid[r][c]) {
        ctx.fillStyle = grid[r][c];
        ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        // Add texture pattern overlay
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
  // Draw current moving piece with gradient for realism
  const { shape, x, y, color } } = currentPiece;
  let gradient = ctx.createLinearGradient(
    (x) * BLOCK_SIZE,
    (y) * BLOCK_SIZE,
    (x + shape[0].length) * BLOCK_SIZE,
    (y + shape.length) * BLOCK_SIZE
  );
  gradient.addColorStop(0, '#FFFFFF');
  gradient.addColorStop(1, color);
  ctx.fillStyle = gradient;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c]) {
        ctx.fillRect(
          (x + c) * BLOCK_SIZE,
          (y + r) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
      }
    }
  }
  // Draw score with glow effect
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#fff';
  ctx.font = `${BLOCK_SIZE * 0.8}px Arial`;
  ctx.fillText("Score: " + score, 10, BLOCK_SIZE); 
  ctx.shadowBlur = 0;
  requestAnimationFrame(draw);
}

// Start game connections
init();
setInterval(update, 300); // Increased speed
requestAnimationFrame(draw);