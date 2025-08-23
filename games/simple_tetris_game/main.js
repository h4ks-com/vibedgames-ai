const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('startBtn');
const muteBtn = document.getElementById('muteBtn');
const sound = document.getElementById('tetrisSound');

let gameInterval;
let isGameOver = false;
let score = 0;
let isMuted = false;

const ROWS = 20;
const COLUMNS = 10;
const BLOCK_SIZE = 20;

canvas.width = COLUMNS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

nextCanvas.width = 4 * BLOCK_SIZE;
nextCanvas.height = 4 * BLOCK_SIZE;

// Define shapes and rotations
const TETROMINOS = {
    'I': [[1, 1, 1, 1]],
    'J': [[1, 0, 0], [1, 1, 1]],
    'L': [[0, 0, 1], [1, 1, 1]],
    'O': [[1, 1], [1, 1]],
    'S': [[0, 1, 1], [1, 1, 0]],
    'T': [[0, 1, 0], [1, 1, 1]],
    'Z': [[1, 1, 0], [0, 1, 1]]
};

const COLORS = {
    'I': 'cyan',
    'J': 'blue',
    'L': 'orange',
    'O': 'yellow',
    'S': 'green',
    'T': 'purple',
    'Z': 'red'
};

let board = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
let currentPiece = null;
let nextPiece = null;
let currentX = 0;
let currentY = 0;
let currentShape = null;
let currentColor = null;

// Generate random piece
function generatePiece() {
    const shapes = Object.keys(TETROMINOS);
    const randShape = shapes[Math.floor(Math.random() * shapes.length)];
    return { shape: randShape, matrix: TETROMINOS[randShape], color: COLORS[randShape] };
}

// Draw a block
function drawBlock(x, y, color) {
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    context.strokeStyle = 'black';
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// Draw the board
function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLUMNS; x++) {
            if (board[y][x]) {
                drawBlock(x, y, board[y][x]);
            } else {
                context.strokeStyle = 'lightgrey';
                context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
    if (currentShape) {
        for (let y = 0; y < currentShape.matrix.length; y++) {
            for (let x = 0; x < currentShape.matrix[y].length; x++) {
                if (currentShape.matrix[y][x]) {
                    drawBlock(currentX + x, currentY + y, currentColor);
                }
            }
        }
    }
}

// Draw next piece
function drawNext() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    for (let y = 0; y < nextPiece.matrix.length; y++) {
        for (let x = 0; x < nextPiece.matrix[y].length; x++) {
            if (nextPiece.matrix[y][x]) {
                nextContext.fillStyle = nextPiece.color;
                nextContext.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                nextContext.strokeStyle = 'black';
                nextContext.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

// Check collision
function hasCollision(offsetX = 0, offsetY = 0, matrix = null) {
    const shape = matrix || currentShape.matrix;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = currentX + x + offsetX;
                const newY = currentY + y + offsetY;
                if (newX < 0 || newX >= COLUMNS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Lock piece
function lockPiece() {
    for (let y = 0; y < currentShape.matrix.length; y++) {
        for (let x = 0; x < currentShape.matrix[y].length; x++) {
            if (currentShape.matrix[y][x]) {
                const boardX = currentX + x;
                const boardY = currentY + y;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentColor;
                }
            }
        }
    }
    clearLines();
    spawnNewPiece();
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;
    for (let y = 0; y < ROWS; y++) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(COLUMNS).fill(0));
            linesCleared++;
        }
    }
    score += linesCleared * 10;
    scoreElement.innerText = score;
}

// Spawn new piece
function spawnNewPiece() {
    currentShape = nextPiece;
    currentX = Math.floor(COLUMNS / 2) - Math.ceil(currentShape.matrix[0].length / 2);
    currentY = -currentShape.matrix.length;
    nextPiece = generatePiece();
    drawNext();
    if (hasCollision()) {
        endGame();
    }
}

// Rotate matrix
function rotate(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];
    for (let x = 0; x < cols; x++) {
        rotated[x] = [];
        for (let y = 0; y < rows; y++) {
            rotated[x][rows - y - 1] = matrix[y][x];
        }
    }
    return rotated;
}

// Handle key events
function handleKey(e) {
    if (isGameOver) return;
    if (e.key === 'ArrowLeft') {
        if (!hasCollision(-1, 0)) {
            currentX--;
        }
    } else if (e.key === 'ArrowRight') {
        if (!hasCollision(1, 0)) {
            currentX++;
        }
    } else if (e.key === 'ArrowDown') {
        if (!hasCollision(0, 1)) {
            currentY++;
        } else {
            lockPiece();
        }
    } else if (e.key === 'ArrowUp') {
        const rotatedShape = rotate(currentShape.matrix);
        if (!hasCollision(0, 0, rotatedShape)) {
            currentShape.matrix = rotatedShape;
        }
    } else if (e.key === ' ') {
        while (!hasCollision(0, 1)) {
            currentY++;
        }
        lockPiece();
    }
    drawBoard();
}

// Game over
function endGame() {
    clearInterval(gameInterval);
    isGameOver = true;
    alert('Game Over! Your score: ' + score);
}

// Game loop
function gameLoop() {
    if (!hasCollision(0, 1)) {
        currentY++;
    } else {
        lockPiece();
        if (!isGameOver) {
            spawnNewPiece();
        }
    }
    drawBoard();
}

// Event listeners for controls
document.addEventListener('keydown', handleKey);
startBtn.addEventListener('click', () => {
    // Reset game state
    board = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
    score = 0;
    scoreElement.innerText = score;
    isGameOver = false;
    currentShape = null;
    spawnNewPiece();
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 500);
    // Play sound
    sound.currentTime = 0;
    if (!isMuted) {
        sound.play();
    }
});

muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
        sound.pause();
    } else {
        sound.play();
    }
});

// Initialize
drawBoard();
// Generate initial next piece
nextPiece = generatePiece();
spawnNewPiece();
drawNext();
