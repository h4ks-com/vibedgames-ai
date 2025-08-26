// Initialize canvas size
canvas.width = cols * gridSize;
canvas.height = rows * gridSize;

// Set up event listeners for controls
function setupControls() {
  document.getElementById('pauseButton').addEventListener('click', () => {
    gamePaused = !gamePaused;
  });
  document.getElementById('restartButton').addEventListener('click', () => {
    resetGame();
    spawnNewShape();
    draw();
  });
  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (gamePaused) return;
    switch(e.key) {
      case 'ArrowLeft':
        if (!collision(currentShape, currentX - 1, currentY, currentRotation)) currentX -=1; break;
      case 'ArrowRight':
        if (!collision(currentShape, currentX + 1, currentY, currentRotation)) currentX +=1; break;
      case 'ArrowDown':
        moveDown(); break;
      case 'ArrowUp':
        rotate(); break;
      case ' ': // space for hard drop
        hardDrop(); break;
    }
    draw();
  });
  // Touch controls can be added here for mobile
}

// Call setupControls on game start
setupControls();

// Adjust update function to respect pause
function update() {
  if (!gamePaused) {
    moveDown();
    draw();
  }
}

// Include game over handling for high scores or restart
function gameOver() {
  alert('Game Over! Your score: ' + score);
  clearInterval(gameInterval);
  document.getElementById('main-menu').style.display = 'block';
  document.getElementById('game-screen').style.display = 'none';
}

// Ensure grid and shape variable are defined
let grid = Array.from({ length: rows }, () => Array(cols).fill(0));
// spawnNewShape function already defined
// draw function already defined
// startGame function already defined, but ensure it resets variables
function startGame() {
  mainMenu.style.display = 'none';
  gameScreen.style.display = 'block';
  resetGame();
  spawnNextShape();
  spawnNewShape();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(update, dropSpeed);
}

// Set up responsive canvas size
window.addEventListener('resize', () => {
  const availableWidth = window.innerWidth * 0.9;
  const availableHeight = window.innerHeight * 0.8;
  const size = Math.min(availableWidth / cols, availableHeight / rows, 600);
  canvas.width = size * cols;
  canvas.height = size * rows;
  gridSize = size;
  draw();
});

// Call resize to set initial size
window.dispatchEvent(new Event('resize'));
