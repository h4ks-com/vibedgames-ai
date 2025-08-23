const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreSpan = document.getElementById('score');
const linesSpan = document.getElementById('lines');
const levelSpan = document.getElementById('level');
const startBtn = document.getElementById('startBtn');

// Add audio element for Tetris theme
const tetrisThemeAudio = new Audio('https://www.myinstants.com/media/sounds/tetris_theme_a.mp3');
tetrisThemeAudio.loop = false; // Play once per start

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

let grid = [];
let currentPiece = null;
let gameInterval = null;
let score = 0;
let linesCleared = 0;
let level = 1;
let dropSpeed = 1000; // initial speed in ms

// Tetromino shapes and rotations
const shapes = {
  I: [
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]]
  ],
  O: [
    [[1, 1], [1, 1]]
  ],
  T: [
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]]
  ],
  S: [
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]]
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]]
  ],
  J: [
    [[1, 0, 0], [1, 1, 1]],
    [[1, 1], [1, 0], [1, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[0, 1], [0, 1], [1, 1]]
  ],
  L: [
    [[0, 0, 1], [1, 1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1], [0, 1], [0, 1]]
  ]
};

const colors = {
  I: '#00f',
  O: '#ff0',
  T: '#a0f',
  S: '#0f0',
  Z: '#f00',
  J: '#0ff',
  L: '#f80'
};

function createGrid() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function drawCell(row, col, color) {
  context.fillStyle = color;
  context.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  context.strokeStyle = '#555';
  context.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function clearCanvas() {
  context.fillStyle = '#222';
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let r=0; r<ROWS; r++) {
    for (let c=0; c<COLS; c++) {
      const cell = grid[r][c];
      if (cell) {
        drawCell(r, c, colors[cell]);
      } else {
        drawCell(r, c, '#222');
      }
    }
  }
}

function generatePiece() {
  const shapeNames = Object.keys(shapes);
  const randShape = shapeNames[Math.floor(Math.random() * shapeNames.length)];
  const rotations = shapes[randShape];
  const rotationIndex = 0;
  const shape = rotations[rotationIndex];
  return {
    shape: shape,
    rotationIndex: rotationIndex,
    shapeName: randShape,
    row: 0,
    col: Math.floor(COLS/2) - Math.ceil(shape[0].length / 2)
  };
}

function drawPiece(piece) {
  for (let r=0; r<piece.shape.length; r++) {
    for (let c=0; c<piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const row = piece.row + r;
        const col = piece.col + c;
        if (row >=0) {
          drawCell(row, col, colors[piece.shapeName]);
        }
      }
    }
  }
}

function canMove(piece, deltaRow, deltaCol) {
  for (let r=0; r<piece.shape.length; r++) {
    for (let c=0; c<piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const newRow = piece.row + r + deltaRow;
        const newCol = piece.col + c + deltaCol;
        if (newRow >= ROWS || newCol < 0 || newCol >= COLS)
          return false;
        if (newRow >= 0 && grid[newRow][newCol])
          return false;
      }
    }
  }
  return true;
}

function rotatePiece(piece) {
  const rotations = shapes[piece.shapeName];
  const nextIndex = (piece.rotationIndex + 1) % rotations.length;
  const nextShape = rotations[nextIndex];
  const oldShape = piece.shape;
  // Temporarily set shape to next
  piece.shape = nextShape;
  if (canMove(piece, 0, 0)) {
    piece.rotationIndex = nextIndex;
  } else {
    // revert
    piece.shape = oldShape;
  }
}

function lockPiece() {
  for (let r=0; r<currentPiece.shape.length; r++) {
    for (let c=0; c<currentPiece.shape[r].length; c++) {
      if (currentPiece.shape[r][c]) {
        const row = currentPiece.row + r;
        const col = currentPiece.col + c;
        if (row>=0 && row<ROWS && col>=0 && col<COLS) {
          grid[row][col] = currentPiece.shapeName;
        }
      }
    }
  }
}

function clearLines() {
  let lines = 0;
  for (let r= ROWS -1; r>=0; r--) {
    if (grid[r].every(cell => cell)) {
      grid.splice(r,1);
      grid.unshift(new Array(COLS).fill(0));
      lines++;
      r++;
    }
  }
  if (lines > 0) {
    linesCleared += lines;
    score += lines * 100;
    if (linesCleared >= 10 * level) {
      level++;
      dropSpeed = Math.max(100, dropSpeed - 100);
    }
    scoreSpan.textContent = score;
    linesSpan.textContent = linesCleared;
    levelSpan.textContent = level;
  }
}

function spawnNewPiece() {
  currentPiece = generatePiece();
  currentPiece.row = 0;
  currentPiece.col = Math.floor(COLS/2) - Math.ceil(currentPiece.shape[0].length / 2);
  if (!canMove(currentPiece, 0, 0)) {
    // game over
    stopGame();
    alert("Game Over!");
  }
}

function moveDown() {
  if (canMove(currentPiece, 1, 0)) {
    currentPiece.row +=1;
  } else {
    lockPiece();
    clearLines();
    spawnNewPiece();
  }
  draw();
}

function moveLeft() {
  if (canMove(currentPiece, 0, -1)) {
    currentPiece.col -=1;
    draw();
  }
}

function moveRight() {
  if (canMove(currentPiece, 0, 1)) {
    currentPiece.col +=1;
    draw();
  }
}

function rotate() {
  rotatePiece(currentPiece);
  draw();
}

function hardDrop() {
  while (canMove(currentPiece, 1, 0)) {
    currentPiece.row +=1;
  }
  lockPiece();
  clearLines();
  spawnNewPiece();
  draw();
}

function draw() {
  clearCanvas();
  drawGrid();
  drawPiece(currentPiece);
}

function gameTick() {
  moveDown();
}

function startGame() {
  createGrid();
  spawnNewPiece();
  draw();
  gameInterval = setInterval(gameTick, dropSpeed);
  tetrisThemeAudio.currentTime = 0;
  tetrisThemeAudio.play();
}

function stopGame() {
  clearInterval(gameInterval);
}

// Attach event listener for start button
document.getElementById('startBtn').addEventListener('click', () => {
  if (gameInterval) clearInterval(gameInterval);
  score = 0;
  linesCleared = 0;
  level = 1;
  dropSpeed = 1000;
  scoreSpan.textContent = score;
  linesSpan.textContent = linesCleared;
  levelSpan.textContent = level;
  createGrid();
  spawnNewPiece();
  draw();
  gameInterval = setInterval(gameTick, dropSpeed);
  tetrisThemeAudio.currentTime = 0;
  tetrisThemeAudio.play();
});

document.addEventListener('keydown', (e) => {
  if (!currentPiece) return;
  switch (e.key) {
    case 'ArrowLeft':
      moveLeft();
      break;
    case 'ArrowRight':
      moveRight();
      break;
    case 'ArrowUp':
    case 'x':
    case 'X':
      rotate();
      break;
    case 'ArrowDown':
    case 'z':
    case 'Z':
      moveDown();
      break;
    case ' ': // space for hard drop
      hardDrop();
      break;
  }
});

// Initialize game state
createGrid();
spawnNewPiece();
draw();