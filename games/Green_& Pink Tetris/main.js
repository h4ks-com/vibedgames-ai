// Initialize game variables
const startBtn = document.getElementById('startBtn');
const mainMenu = document.querySelector('.menu');
const gameScreen = document.querySelector('.game-screen');
const settingsBtn = document.getElementById('settingsBtn');
const highScoresBtn = document.getElementById('highScoresBtn');
const exitBtn = document.getElementById('exitBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');
const mainMenuBtn = document.getElementById('mainMenuBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const backFromSettingsBtn = document.getElementById('backFromSettingsBtn');
const backFromHighScoresBtn = document.getElementById('backFromHighScoresBtn');

// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

// Display elements
const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const linesDisplay = document.getElementById('linesDisplay');
const highScoreList = document.getElementById('highScoreList');

// Buttons
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtnGame = document.getElementById('restartBtn');
const mainMenuBtnGame = document.getElementById('mainMenuBtn');

// Settings
const soundToggle = document.getElementById('soundToggle');
const musicToggle = document.getElementById('musicToggle');
const colorThemeSelect = document.getElementById('colorTheme');

// Game variables
let grid = [],
    currentPiece,
    nextPiece,
    holdPiece,
    gameInterval,
    score = 0,
    level = 1,
    lines = 0,
    fallTime = 1000,
    gamePaused = false,
    gameOverFlag = false,
    tickCount = 0;

// Color themes
const themes = {
  'pink-green': {primary: '#ff69b4', secondary: '#00ff7f'},
  'vibrant': {primary: '#ff1493', secondary: '#32cd32'}
};

// Shapes
const shapes = {
  I: [[1,1,1,1]],
  J: [[1,0,0],[1,1,1]],
  L: [[0,0,1],[1,1,1]],
  O: [[1,1],[1,1]],
  S: [[0,1,1],[1,1,0]],
  T: [[0,1,0],[1,1,1]],
  Z: [[1,1,0],[0,1,1]]
};

// Generate grid
function initGrid() {
  grid = Array.from({length: 20}, () => Array(10).fill(0));
}

// Draw functions
function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x*24, y*24, 24, 24);
  ctx.strokeStyle = '#222';
  ctx.strokeRect(x*24, y*24, 24,24);
}

function drawGrid() {
  ctx.clearRect(0,0,240,400);
  for(let y=0; y<20; y++){
    for(let x=0; x<10; x++){
      if (grid[y][x]) {
        drawCell(x,y,grid[y][x]);
      }
    }
  }
}

// Piece class
class Piece {
  constructor(type) {
    this.type = type;
    this.shape = shapes[type];
    this.rotationIndex = 0;
    this.color = (type==='I'||type==='O') ? themes['vibrant'].primary : themes['pink-green'].primary;
    this.x = 3;
    this.y = 0;
  }
  get currentShape() {
    return this.shape[this.rotationIndex % this.shape.length];
  }
  rotate() {
    this.rotationIndex = (this.rotationIndex + 1) % this.shape.length;
  }
  rotateBack() {
    this.rotationIndex = (this.rotationIndex + this.shape.length -1) % this.shape.length;
  }
}

// Generate Random Piece
function generatePiece() {
  const types = Object.keys(shapes);
  const randType = types[Math.floor(Math.random() * types.length)];
  return new Piece(randType);
}

// Functions
function spawnNewPiece() {
  currentPiece = nextPiece || generatePiece();
  nextPiece = generatePiece();
  currentPiece.x = 3;
  currentPiece.y = 0;
  if (checkCollision(currentPiece)) {
    endGame();
  }
}

function checkCollision(piece, dx=0, dy=0, rotation=null) {
  const shape = rotation !== null ? shapeAtRotation(piece, rotation) : piece.currentShape;
  for(let y=0; y<shape.length; y++) {
    for(let x=0; x<shape[y].length; x++) {
      if (shape[y][x]) {
        let newX = piece.x + x + dx;
        let newY = piece.y + y + dy;
        if (newX<0 || newX>=10 || newY>=20 || (newY>=0 && grid[newY][newX])) {
          return true;
        }
      }
    }
  }
  return false;
}

function shapeAtRotation(piece, rotation) {
  const index = rotation % piece.shape.length;
  return piece.shape[index];
}

function lockPiece() {
  const shape = currentPiece.currentShape;
  for(let y=0; y<shape.length; y++) {
    for(let x=0; x<shape[y].length; x++) {
      if (shape[y][x]) {
        const gx = currentPiece.x + x;
        const gy = currentPiece.y + y;
        if (gy>=0 && gy<20 && gx>=0 && gx<10) {
          grid[gy][gx] = currentPiece.color;
        }
      }
    }
  }
  clearLines();
  spawnNewPiece();
  canHold=true;
}

function clearLines() {
  let linesCleared=0;
  for(let y=19; y>=0; y--) {
    if (grid[y].every(cell => cell)) {
      grid.splice(y,1);
      grid.unshift(Array(10).fill(0));
      linesCleared++;
      y++;
    }
  }
  updateScore(linesCleared);
  lines += linesCleared;
  if (lines >= level*10) {
    level++;
    fallTime = Math.max(fallTime-50, 200);
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, fallTime);
  }
}

function updateScore(lines) {
  const pointsMap={1:40,2:100,3:300,4:1200};
  score += pointsMap[lines] ? pointsMap[lines] * level : 0;
  scoreDisplay.textContent=score;
  levelDisplay.textContent=level;
  linesDisplay.textContent=lines;
}

function move(dx) {
  if (!checkCollision(currentPiece, dx,0)) {
    currentPiece.x += dx;
  }
}

function rotate() {
  currentPiece.rotate();
  if (checkCollision(currentPiece)) {
    currentPiece.rotateBack();
  }
}

function softDrop() {
  if (!checkCollision(currentPiece,0,1)) {
    currentPiece.y +=1;
  } else {
    lockPiece();
  }
}

function hardDrop() {
  while(!checkCollision(currentPiece,0,1)) {
    currentPiece.y +=1;
  }
  lockPiece();
}

function hold() {
  if (!canHold) return;
  if (!holdPiece) {
    holdPiece = {...currentPiece};
    spawnNewPiece();
  } else {
    const temp = {...holdPiece};
    holdPiece = {...currentPiece};
    currentPiece = temp;
    currentPiece.x=3;
    currentPiece.y=0;
    if (checkCollision(currentPiece)) {
      endGame();
    }
  }
  canHold=false;
  drawHold();
}

// Drawing functions
function drawCurrent() {
  drawGrid();
  const shape = currentPiece.currentShape;
  for(let y=0; y<shape.length; y++) {
    for(let x=0; x<shape[y].length; x++) {
      if (shape[y][x]) {
        drawCell(currentPiece.x+x, currentPiece.y+y, currentPiece.color);
      }
    }
  }
}

function drawNext() {
  nextCtx.clearRect(0,0,80,80);
  if (nextPiece) {
    const shape = nextPiece.shape[0];
    for(let y=0; y<shape.length; y++) {
      for(let x=0; x<shape[y].length; x++) {
        if (shape[y][x]) {
          nextCtx.fillStyle=nextPiece.color;
          nextCtx.fillRect(x*24, y*24, 24,24);
          nextCtx.strokeStyle='#222';
          nextCtx.strokeRect(x*24, y*24, 24,24);
        }
      }
    }
  }
}

function drawHold() {
  holdCtx.clearRect(0,0,80,80);
  if (holdPiece) {
    const shape = holdPiece.shape[0];
    for(let y=0; y<shape.length; y++) {
      for(let x=0; x<shape[y].length; x++) {
        if (shape[y][x]) {
          holdCtx.fillStyle=holdPiece.color;
          holdCtx.fillRect(x*24, y*24, 24,24);
          holdCtx.strokeStyle='#222';
          holdCtx.strokeRect(x*24, y*24, 24,24);
        }
      }
    }
  }
}

// Game loop
function gameLoop() {
  if (!checkCollision(currentPiece,0,1)) {
    currentPiece.y +=1;
  } else {
    lockPiece();
  }
  drawCurrent();
  drawNext();
  drawHold();
}

// Start game
startBtn.addEventListener('click', () => {
  initGrid();
  score=0; level=1; lines=0;
  scoreDisplay.textContent=score;
  levelDisplay.textContent=level;
  linesDisplay.textContent=0;
  spawnNewPiece();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, fallTime);
  document.querySelector('.menu').style.display='none';
  document.querySelector('.game-screen').style.display='flex';
});

// Controls
document.addEventListener('keydown', e => {
  if (e.key==='ArrowLeft') move(-1);
  if (e.key==='ArrowRight') move(1);
  if (e.key==='ArrowDown') softDrop();
  if (e.key==='ArrowUp') rotate();
  if (e.key===' ') hardDrop();
  if (e.key==='Shift') hold();
  drawCurrent();
  drawNext();
  drawHold();
});

// Pause and resume
document.getElementById('pauseBtn').addEventListener('click', () => {
  clearInterval(gameInterval);
});

resumeBtn.addEventListener('click', () => {
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, fallTime);
});

// Restart
restartBtn.addEventListener('click', () => {
  initGrid();
  score=0; level=1; lines=0;
  scoreDisplay.textContent=score;
  levelDisplay.textContent=level;
  linesDisplay.textContent=0;
  spawnNewPiece();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, fallTime);
});

// Main menu
document.getElementById('mainMenuBtn').addEventListener('click', () => {
  clearInterval(gameInterval);
  document.querySelector('.menu').style.display='block';
  document.querySelector('.game-screen').style.display='none';
});

// End game
function endGame() {
  clearInterval(gameInterval);
  alert('Game Over! Your score: ' + score);
  document.querySelector('.menu').style.display='block';
  document.querySelector('.game-screen').style.display='none';
}

// Initialization
function init() {
  initGrid();
  drawGrid();
  drawNext();
  drawHold();
}

// Initialize on load
window.onload = init;