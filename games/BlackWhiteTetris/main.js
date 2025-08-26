const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const nextContainer = document.getElementById('next');

const ROWS = 20;
const COLS = 10;
const CELL_SIZE = 24;

let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let linesCleared = 0;
let gameOver = false;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

const shapes = {
    'I': [[1, 1, 1, 1]],
    'O': [[1, 1], [1, 1]],
    'T': [[0, 1, 0], [1, 1, 1]],
    'S': [[0, 1, 1], [1, 1, 0]],
    'Z': [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
};

const shapeColors = {
    'I': 'rgba(255,255,255,0.8)',
    'O': 'rgba(255,255,255,0.8)',
    'T': 'rgba(255,255,255,0.8)',
    'S': 'rgba(255,255,255,0.8)',
    'Z': 'rgba(255,255,255,0.8)',
    J: 'rgba(255,255,255,0.8)',
    L: 'rgba(255,255,255,0.8)'
};

function createBoard() {
    board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL_SIZE);
        ctx.lineTo(COLS * CELL_SIZE, r * CELL_SIZE);
        ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL_SIZE, 0);
        ctx.lineTo(c * CELL_SIZE, ROWS * CELL_SIZE);
        ctx.stroke();
    }
}

function drawBoard() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawCell(x, y, 'rgba(255,255,255,0.8)');
            }
        }
    }
}

function generateRandomPiece() {
    const shapeKeys = Object.keys(shapes);
    const randKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
    const shape = shapes[randKey];
    return {
        shape: shape,
        x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
        y: 0,
        type: randKey
    };
}

function rotate(matrix) {
    return matrix[0].map((_, index) => matrix.map(row => row[index]).reverse());
}

function collision(piece, offsetX = 0, offsetY = 0, shapeMatrix = null) {
    const shapeMat = shapeMatrix || piece.shape;
    for (let y = 0; y < shapeMat.length; y++) {
        for (let x = 0; x < shapeMat[y].length; x++) {
            if (shapeMat[y][x]) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;
                if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function lockPiece() {
    const shape = currentPiece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const posX = currentPiece.x + x;
                const POSY = currentPiece.y + y;
                if (POSY >= 0 && POSY < ROWS && posX >= 0 && posX < COLS) {
                    board[POSY][posX] = 1;
                }
            }
        }
    }
}

function clearLines() {
    let lines = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            lines++;
            y++;
        }
    }
    if (lines > 0) {
        score += lines * 100;
        linesCleared += lines;
        if (linesCleared >= level * 10) {
            level++;
            dropInterval *= 0.9;
            levelElement.textContent = 'Level: ' + level;
        }
        scoreElement.textContent = 'Score: ' + score;
    }
}

function spawnPiece() {
    currentPiece = nextPiece || generateRandomPiece();
    nextPiece = generateRandomPiece();
    if (collision(currentPiece)) {
        gameOver = true;
        alert('Game Over!');
    }
}

function draw() {
    drawBoard();
    if (currentPiece) {
        const shape = currentPiece.shape;
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    ctx.fillRect((currentPiece.x + x) * CELL_SIZE, (currentPiece.y + y) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }
    drawGrid();
}

function update(time = 0) {
    if (gameOver) return;
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        drop();
        dropCounter = 0;
    }
    draw();
    requestAnimationFrame(update);
}

function drop() {
    if (!collision(currentPiece, 0, 1)) {
        currentPiece.y++;
    } else {
        lockPiece();
        clearLines();
        spawnPiece();
    }
}

function move(offsetX) {
    if (!collision(currentPiece, offsetX, 0)) {
        currentPiece.x += offsetX;
    }
}

function rotatePiece() {
    const rotatedShape = rotate(currentPiece.shape);
    if (!collision(currentPiece, 0, 0, rotatedShape)) {
        currentPiece.shape = rotatedShape;
    }
}

function hardDrop() {
    while (!collision(currentPiece, 0, 1)) {
        currentPiece.y++;
    }
    lockPiece();
    clearLines();
    spawnPiece();
}

document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    switch (e.key) {
        case 'ArrowLeft':
            move(-1);
            break;
        case 'ArrowRight':
            move(1);
            break;
        case 'ArrowDown':
            if (!collision(currentPiece, 0, 1)) {
                currentPiece.y++;
            }
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case 'z':
        case 'Z':
            const rotatedShapeCCW = rotate(rotate(rotate(currentPiece.shape)));
            if (!collision(currentPiece, 0, 0, rotatedShapeCCW)) {
                currentPiece.shape = rotatedShapeCCW;
            }
            break;
        case ' ': 
            hardDrop();
            break;
        case 'p':
        case 'P':
            // Pause/resume logic can be added here if desired
            break;
    }
});

function startGame() {
    createBoard();
    spawnPiece();
    requestAnimationFrame(update);
}

startGame();