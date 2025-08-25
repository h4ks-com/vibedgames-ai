 (function() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const pauseBtn = document.getElementById('pauseBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const restartBtn = document.getElementById('restartBtn');
  const homeBtn = document.getElementById('homeBtn');
  const retryBtn = document.getElementById('retryBtn');
  const mainMenuBtn = document.getElementById('mainMenuBtn');
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 30;
  canvas.width = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;
  const pastelColors = {
    I: '#FFB6C1',
    J: '#ADD8E6',
    L: '#FF69B4',
    O: '#FF1493',
    S: '#FFC0CB',
    T: '#FF69B4',
    Z: '#FFB6C1',
    empty: '#F8F8F8',
    gridBorder: 'rgba(255,255,255,0.2)'
  };
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
  let nextTetromino = null;
  let holdTetromino = null;
  let spawnPositionX = Math.floor(COLS/2) - 1;
  let gameInterval = null;
  let score = 0;
  let level = 1;
  let totalLines = 0;
  let dropSpeed = 500;
  let gamePaused = false;
  let gameOver = false;
  function initGrid() {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill('empty'));
  }
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
  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r=0; r<ROWS; r++) {
      for (let c=0; c<COLS; c++) {
        ctx.fillStyle = pastelColors[grid[r][c]] || pastelColors['empty'];
        ctx.strokeStyle = pastelColors.gridBorder;
        ctx.lineWidth = 1;
        ctx.fillRoundRect(c*BLOCK_SIZE+2, r*BLOCK_SIZE+2, BLOCK_SIZE-4, BLOCK_SIZE-4, 8);
        ctx.strokeRoundRect(c*BLOCK_SIZE+2, r*BLOCK_SIZE+2, BLOCK_SIZE-4, BLOCK_SIZE-4, 8);
      }
    }
  }
  function spawnTetromino() {
    const keys = Object.keys(SHAPES);
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    const shape = SHAPES[randKey];
    const color = pastelColors[randKey];
    const x = Math.floor(COLS/2) - Math.ceil(shape[0].length/2);
    const y = 0;
    return {
      shape,
      color,
      x,
      y
    };
  }
  function drawTetromino() {
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.fillStyle = currentTetromino.color;
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
  function checkCollision(dx, dy, shape) {
    for (let r=0; r<shape.length; r++) {
      for (let c=0; c<shape[r].length; c++) {
        if (shape[r][c]) {
          const nx = currentTetromino.x + c + dx;
          const ny = currentTetromino.y + r + dy;
          if (
            nx < 0 || nx >= COLS ||
            ny >= ROWS ||
            (ny >=0 && grid[ny][nx] !== 'empty')
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }
  function lockTetromino() {
    const shape = currentTetromino.shape;
    for (let r=0; r<shape.length; r++) {
      for (let c=0; c<shape[r].length; c++) {
        if (shape[r][c]) {
          const x = currentTetromino.x + c;
          const y = currentTetromino.y + r;
          if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
            grid[y][x] = currentTetromino.color;
          }
        }
      }
    }
    animateLineClear();
    checkAndClearLines();
    spawnNextTetromino();
  }
  function checkAndClearLines() {
    const linesToClear = [];
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
  function animateLineClear(lines) {
    const starCount = 20;
    const stars = [];
    for (let i=0; i<starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 2,
        color: '#ffe6f0',
        dx: (Math.random() - 0.5) * 4,
        dy: (Math.random() - 0.5) * 4
      });
    }
    let frames = 0;
    function drawSparkles() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      drawGrid();
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI*2);
        ctx.fillStyle = star.color;
        ctx.fill();
        star.x += star.dx;
        star.y += star.dy;
        star.size *= 0.96;
      });
      frames++;
      if (frames < 15) {
        requestAnimationFrame(drawSparkles);
      }
    }
    drawSparkles();
  }
  function spawnNextTetromino() {
    currentTetromino = spawnTetromino();
    if (checkCollision(0,0,currentTetromino.shape)) {
      triggerGameOver();
    }
  }
  function rotateTetromino() {
    const shape = currentTetromino.shape;
    const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    if (!checkCollision(0,0,rotated)) {
      currentTetromino.shape = rotated;
    } else {
      if (!checkCollision(1,0,rotated)) {
        currentTetromino.x += 1;
        currentTetromino.shape = rotated;
      } else if (!checkCollision(-1,0,rotated)) {
        currentTetromino.x -= 1;
        currentTetromino.shape = rotated;
      }
    }
  }
  function moveX(dx) {
    if (!checkCollision(dx,0,currentTetromino.shape)) {
      currentTetromino.x += dx;
    }
  }
  function softDrop() {
    if (!checkCollision(0,1,currentTetromino.shape)) {
      currentTetromino.y += 1;
    } else {
      lockTetromino();
    }
  }
  function hardDrop() {
    while (!checkCollision(0,1,currentTetromino.shape)) {
      currentTetromino.y++;
    }
    lockTetromino();
  }
  function adjustSpeed() {
    dropSpeed = Math.max(100, 500 - (level - 1) * 50);
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameTick, dropSpeed);
  }
  function triggerGameOver() {
    clearInterval(gameInterval);
    gameOver = true;
    document.getElementById('gameOverOverlay').classList.remove('hidden');
  }
  function startGame() {
    initGrid();
    score=0; level=1; totalLines=0; 
    updateUI();
    spawnNextTetromino();
    adjustSpeed();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameTick, dropSpeed);
    gameOver = false;
    document.getElementById('gameOverOverlay').classList.add('hidden');
  }
  function spawnTetromino() {
    const keys = Object.keys(SHAPES);
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    const shape = SHAPES[randKey];
    const color = pastelColors[randKey];
    const x = Math.floor(COLS/2) - Math.ceil(shape[0].length/2);
    const y = 0;
    return {
      shape,
      color,
      x,
      y
    };
  }
  function updateUI() {
    scoreEl.textContent = "Score: " + score;
    levelEl.textContent = "Level: " + level;
    linesEl.textContent = "Lines: " + totalLines;
  }
  function gameTick() {
    if (gamePaused || gameOver) return;
    softDrop();
    drawAll();
  }
  function drawAll() {
    drawGrid();
    drawTetromino();
  }
  document.addEventListener('keydown', (e) => {
    if (gamePaused || gameOver) return;
    switch (e.key) {
      case 'ArrowLeft':
        moveX(-1);
        break;
      case 'ArrowRight':
        moveX(1);
        break;
      case 'ArrowDown':
        fastDrop = true;
        softDrop();
        break;
      case 'ArrowUp':
        rotateTetromino();
        break;
      case ' ': 
        hardDrop();
        break;
      case 'Shift':
        holdCurrentTetromino();
        break;
    }
    drawAll();
  });
  document.getElementById('pauseBtn').addEventListener('click', () => { togglePause(); });
  document.getElementById('resumeBtn').addEventListener('click', () => { togglePause(false); });
  document.getElementById('restartBtn').addEventListener('click', () => { startGame(); });
  document.getElementById('homeBtn').addEventListener('click', () => { startGame(); });
  document.getElementById('retryBtn').addEventListener('click', () => { startGame(); });
  document.getElementById('mainMenuBtn').addEventListener('click', () => { startGame(); });
  function togglePause(pause=true) {
    gamePaused = pause;
    document.getElementById('pauseOverlay').classList.toggle('hidden', !pause);
  }
  function holdCurrentTetromino() {
    if (holdTetromino === null) {
      holdTetromino = {...currentTetromino};
      spawnNextTetromino();
    } else {
      const temp = holdTetromino;
      holdTetromino = {...currentTetromino};
      currentTetromino = {...temp};
      currentTetromino.x = spawnPositionX;
      currentTetromino.y = 0;
    }
    drawAll();
  }
  function init() {
    initGrid();
    startGame();
  }
  init();
})();