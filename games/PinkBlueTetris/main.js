// Initialization of canvases and context
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold');
const holdCtx = holdCanvas.getContext('2d');

// UI Elements
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const startBtn = document.getElementById('startBtn');

// Game constants
const gridWidth = 10;
const gridHeight = 20;
const blockSize = 24;

// Game state variables
let gameInterval = null;
let currentPiece = null;
let nextPiece = null;
let holdPiece = null;
let canHold = true;
let score = 0;
let level = 1;
let linesCleared = 0;
let grid = createGrid();
let isGameOver = false;

// Define colors and shapes for pieces with vibrant, themed palette
const colors = {
    I: { color: ['#FF69B4', '#FF1493'], shape: [[1,1,1,1]] }, // Pink
    J: { color: ['#1E90FF', '#6495ED'], shape: [[1,0,0],[1,1,1]] }, // Blue
    L: { color: ['#FF69B4', '#FF1493'], shape: [[0,0,1],[1,1,1]] }, // Pink
    O: { color: ['#1E90FF', '#6495ED'], shape: [[1,1],[1,1]] }, // Blue
    S: { color: ['#FF69B4', '#FF1493'], shape: [[0,1,1],[1,1,0]] }, // Pink
    T: { color: ['#1E90FF', '#6495ED'], shape: [[0,1,0],[1,1,1]] }, // Blue
    Z: { color: ['#FF69B4', '#FF1493'], shape: [[1,1,0],[0,1,1]] } // Pink
};

// Create an empty grid
function createGrid() {
    return Array.from({ length: gridHeight }, () => Array(gridWidth).fill(0));
}

// Generate a new piece with random type
function generatePiece() {
    const pieces = Object.keys(colors);
    const randIdx = Math.floor(Math.random() * pieces.length);
    const type = pieces[randIdx];
    const shape = colors[type].shape;
    return {
        type,
        shape: JSON.parse(JSON.stringify(shape)),
        color: colors[type].color,
        rotationIndex: 0,
        x: Math.floor(gridWidth / 2) - Math.ceil(shape[0].length / 2),
        y: 0
    };
}

// Draw a single block with border
function drawBlock(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
}

// Clear entire canvas
function clearCanvas() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw the game grid based on current grid state
function drawGrid() {
    clearCanvas();
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x]) {
                drawBlock(x, y, grid[y][x]);
            }
        }
    }
}

// Render a piece on given context
function drawPiece(piece, ctxObj) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                ctxObj.fillStyle = piece.color[piece.rotationIndex % piece.color.length];
                ctxObj.fillRect((piece.x + x) * blockSize, (piece.y + y) * blockSize, blockSize, blockSize);
                ctxObj.strokeStyle = '#333';
                ctxObj.strokeRect((piece.x + x) * blockSize, (piece.y + y) * blockSize, blockSize, blockSize);
            }
        }
    }
}

// Check for collision with existing grid or boundaries
function collide(piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x;
                const newY = piece.y + y;
                if (
                    newX < 0 || newX >= gridWidth ||
                    newY >= gridHeight ||
                    (newY >= 0 && grid[newY][newX])
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Merge current piece into grid
function mergePiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const gridY = currentPiece.y + y;
                const gridX = currentPiece.x + x;
                if (gridY >= 0) {
                    grid[gridY][gridX] = currentPiece.color[currentPiece.rotationIndex % currentPiece.color.length];
                }
            }
        }
    }
}

// Check and clear complete lines
function clearLines() {
    let lines = 0;
    for (let y = grid.length -1; y >= 0; y--) {
        if (grid[y].every(cell => cell)) {
            grid.splice(y,1);
            grid.unshift(Array(gridWidth).fill(0));
            lines++;
            y++; // recheck same line after removal
        }
    }
    if (lines > 0) {
        updateScore(lines);
        linesCleared += lines;
        if (linesCleared >= level * 10) {
            level++;
            clearInterval(gameInterval);
            gameInterval = setInterval(updateGame, Math.max(200 - (level-1)*20, 50));
            levelDisplay.textContent = level;
        }
    }
}

// Update score based on lines cleared
function updateScore(lines) {
    const scoreMap = {1: 40, 2: 100, 3: 300, 4: 1200};
    score += scoreMap[lines] * level;
    scoreDisplay.textContent = score;
}

// Spawn a new piece as current
function spawnPiece() {
    currentPiece = nextPiece || generatePiece();
    nextPiece = generatePiece();
    currentPiece.x = Math.floor(gridWidth / 2) - Math.ceil(currentPiece.shape[0].length / 2);
    currentPiece.y = 0;
    if (collide(currentPiece)) {
        gameOver();
    }
}

// Handle game over state
function gameOver() {
    clearInterval(gameInterval);
    isGameOver = true;
    alert('Game Over! Your score: ' + score);
}

// Move piece left or right
function movePiece(dx) {
    const moved = {...currentPiece,
        x: currentPiece.x + dx
    };
    if (!collide(moved)) {
        currentPiece.x += dx;
    }
}

// Rotate piece with wall kick handling
function rotatePiece() {
    const oldRotation = currentPiece.rotationIndex;
    currentPiece.rotationIndex = (currentPiece.rotationIndex + 1) % currentPiece.shape.length;
    if (collide(currentPiece)) {
        currentPiece.rotationIndex = oldRotation; // revert if collision
    }
}

// Hard drop to bottom
function hardDrop() {
    while (!collide({ ...currentPiece, y: currentPiece.y + 1 })) {
        currentPiece.y += 1;
    }
    lockPiece();
}

// Lock current piece in place and spawn next
function lockPiece() {
    mergePiece();
    clearLines();
    spawnPiece();
    canHold = true;
}

// Main update loop for automatic descent
function updateGame() {
    if (collide({ ...currentPiece, y: currentPiece.y + 1 })) {
        lockPiece();
    } else {
        currentPiece.y += 1;
    }
    drawGrid();
    drawPiece(currentPiece, ctx);
    drawNext();
    drawHold();
}

// Draw next piece preview
function drawNext() {
    nextCtx.clearRect(0, 0, 80, 80);
    for (let y = 0; y < nextPiece.shape.length; y++) {
        for (let x = 0; x < nextPiece.shape[y].length; x++) {
            if (nextPiece.shape[y][x]) {
                nextCtx.fillStyle = nextPiece.color[nextPiece.rotationIndex % nextPiece.color.length];
                nextCtx.fillRect(x * blockSize / 2, y * blockSize / 2, blockSize / 2, blockSize / 2);
                nextCtx.strokeStyle = '#333';
                nextCtx.strokeRect(x * blockSize / 2, y * blockSize / 2, blockSize / 2, blockSize / 2);
            }
        }
    }
}

// Draw hold piece preview
function drawHold() {
    holdCtx.clearRect(0, 0, 80, 80);
    if (holdPiece) {
        for (let y = 0; y < holdPiece.shape.length; y++) {
            for (let x = 0; x < holdPiece.shape[y].length; x++) {
                if (holdPiece.shape[y][x]) {
                    holdCtx.fillStyle = holdPiece.color[holdPiece.rotationIndex % holdPiece.color.length];
                    holdCtx.fillRect(x * blockSize / 2, y * blockSize / 2, blockSize / 2, blockSize / 2);
                    holdCtx.strokeStyle = '#333';
                    holdCtx.strokeRect(x * blockSize / 2, y * blockSize / 2, blockSize / 2, blockSize / 2);
                }
            }
        }
    }
}

// Hold current piece for later use
function holdCurrentPiece() {
    if (!canHold) return;
    if (!holdPiece) {
        holdPiece = {...currentPiece};
        spawnPiece();
    } else {
        const temp = {...holdPiece};
        holdPiece = {...currentPiece};
        currentPiece = temp;
        currentPiece.x = Math.floor(gridWidth / 2) - Math.ceil(currentPiece.shape[0].length / 2);
        currentPiece.y = 0;
        if (collide(currentPiece)) {
            gameOver();
        }
    }
    canHold = false;
    drawHold();
}

// Add key controls
document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    switch(e.key) {
        case 'ArrowLeft':
            movePiece(-1);
            break;
        case 'ArrowRight':
            movePiece(1);
            break;
        case 'ArrowDown':
            if (!collide({ ...currentPiece, y: currentPiece.y + 1 })) {
                currentPiece.y += 1;
            }
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ': // Space key for hard drop
            hardDrop();
            break;
        case 'c': case 'C':
            holdCurrentPiece();
            break;
    }
    drawGrid();
    drawPiece(currentPiece, ctx);
    drawNext();
    drawHold();
});

// Start game button listener
startBtn.addEventListener('click', () => {
    if (gameInterval) clearInterval(gameInterval);
    grid = createGrid();
    score = 0;
    level = 1;
    linesCleared = 0;
    scoreDisplay.textContent = '0';
    levelDisplay.textContent = '1';
    isGameOver = false;
    spawnPiece();
    gameInterval = setInterval(updateGame, Math.max(200 - (level-1)*20, 50));
});

// Initial drawing
drawGrid();
drawNext();
drawHold();