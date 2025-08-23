const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let score = 0;
let gameInterval;
const gridSize = 10;
let gamePaused = false;
let currentBlock = null;
let nextBlock = null;
let grid = [];
const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF5', '#F5FF33', '#FF33A8'];
const totalLayers = 20;
let currentSpeed = 500;
let fallInterval;
// Initialize Canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.9;
    canvas.height = window.innerHeight * 0.8;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initialize Grid
function initGrid() {
    for (let y = 0; y < totalLayers; y++) {
        grid[y] = [];
        for (let x = 0; x < gridSize; x++) {
            grid[y][x] = [];
            for (let z = 0; z < gridSize; z++) {
                grid[y][x][z] = 0;
            }
        }
    }
}

// Block Shapes
const blockShapes = [
    // Cube
    [[[1,1],[1,1]]],
    // Line
    [[[1,1,1,1]]],
    // T shape
    [[[0,1,0],[1,1,1]]],
    // L shape
    [[[1,0],[1,0],[1,1]]],
    // S shape
    [[[0,1,1],[1,1,0]]]
];

// Generate Random Block
function generateBlock() {
    const shape = blockShapes[Math.floor(Math.random() * blockShapes.length)];
    return {
        shape: shape,
        position: {x: Math.floor(gridSize/2) - Math.ceil(shape[0][0].length/2), y: 0, z: Math.floor(gridSize/2) - Math.ceil(shape[0].length/2)},
        color: colors[Math.floor(Math.random() * colors.length)]
    };
}

// Draw Grid
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Basic 2D projection of 3D grid logic
    const tileSize = Math.min(canvas.width, canvas.height) / gridSize;
    for (let y = 0; y < totalLayers; y++) {
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                if (grid[y][x][z] !== 0) {
                    ctx.fillStyle = grid[y][x][z];
                    ctx.fillRect(z * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }
    }
    // Draw current moving block
    if (currentBlock) {
        currentBlock.shape.forEach((layer, ly) => {
            layer.forEach((row, rx) => {
                row.forEach((cell, rz) => {
                    if (cell) {
                        const xPos = (currentBlock.position.x + rx) * tileSize;
                        const yPos = (currentBlock.position.y + ly) * tileSize;
                        ctx.fillStyle = currentBlock.color;
                        ctx.fillRect(xPos, yPos, tileSize, tileSize);
                    }
                });
            });
        });
    }
}

// Movement and Rotation Controls
document.addEventListener('keydown', (e) => {
    if (gamePaused) return;
    switch(e.key) {
        case 'ArrowLeft': // Move Left
            currentBlock.position.x -= 1;
            if (!isValidPosition()) currentBlock.position.x += 1;
            break;
        case 'ArrowRight': // Move Right
            currentBlock.position.x += 1;
            if (!isValidPosition()) currentBlock.position.x -= 1;
            break;
        case 'ArrowUp': // Move Up
            currentBlock.position.y -= 1;
            if (!isValidPosition()) currentBlock.position.y += 1;
            break;
        case 'ArrowDown': // Move Down
            currentBlock.position.y += 1;
            if (!isValidPosition()) currentBlock.position.y -= 1;
            break;
        case 'a': // Rotate X
            rotateBlock('x');
            break;
        case 's': // Rotate Y
            rotateBlock('y');
            break;
        case 'd': // Rotate Z
            rotateBlock('z');
            break;
        case ' ': // Instant Drop
            instantDrop();
            break;
    }
    drawGrid();
});

// Validate Position
function isValidPosition() {
    const shape = currentBlock.shape;
    for (let ly = 0; ly < shape.length; ly++) {
        for (let lx = 0; lx < shape[ly].length; lx++) {
            for (let lz = 0; lz < shape[ly][lx].length; lz++) {
                if (shape[ly][lx][lz]) {
                    const x = currentBlock.position.x + lx;
                    const y = currentBlock.position.y + ly;
                    const z = currentBlock.position.z + lz;
                    if (x < 0 || x >= gridSize || y >= totalLayers || z < 0 || z >= gridSize) {
                        return false;
                    }
                    if (y >= 0 && grid[y][x][z] !== 0) {
                        return false;
                    }
                }
            }
        }
    }
    return true;
}

// Rotate Block
function rotateBlock(axis) {
    const shape = currentBlock.shape;
    let rotated;
    if (axis === 'x') {
        rotated = shape[0].map((_, index) => shape.map(row => row[index])).reverse();
    } else if (axis === 'y') {
        rotated = shape.map(layer => layer.reverse());
    } else if (axis === 'z') {
        rotated = shape[0].map((_, index) => shape.map(row => row[index])).reverse();
    }
    currentBlock.shape = rotated;
    if (!isValidPosition()) {
        // Revert rotation if invalid
        currentBlock.shape = shape;
    }
}

// Drop Current Block
function drop() {
    currentBlock.position.y += 1;
    if (!isValidPosition()) {
        currentBlock.position.y -= 1;
        placeBlock();
        clearLayers();
        spawnNewBlock();
    }
}

// Instant Drop
function instantDrop() {
    while (isValidPosition()) {
        currentBlock.position.y += 1;
    }
    currentBlock.position.y -= 1;
    placeBlock();
    clearLayers();
    spawnNewBlock();
}

// Place Block in Grid
function placeBlock() {
    const shape = currentBlock.shape;
    for (let ly = 0; ly < shape.length; ly++) {
        for (let lx = 0; lx < shape[ly].length; lx++) {
            for (let lz = 0; lz < shape[ly][lx].length; lz++) {
                if (shape[ly][lx][lz]) {
                    const x = currentBlock.position.x + lx;
                    const y = currentBlock.position.y + ly;
                    const z = currentBlock.position.z + lz;
                    if (y >= 0 && y < totalLayers && x >= 0 && z >= 0 && z < gridSize) {
                        grid[y][x][z] = currentBlock.color;
                    }
                }
            }
        }
    }
}

// Clear Completed Layers
function clearLayers() {
    for (let y = 0; y < totalLayers; y++) {
        let fullLayer = true;
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                if (grid[y][x][z] === 0) {
                    fullLayer = false;
                    break;
                }
            }
            if (!fullLayer) break;
        }
        if (fullLayer) {
            // Remove the layer and add new empty layer at top
            grid.splice(y, 1);
            const newLayer = [];
            for (let x = 0; x < gridSize; x++) {
                newLayer[x] = [];
                for (let z = 0; z < gridSize; z++) {
                    newLayer[x][z] = 0;
                }
            }
            grid.push(newLayer);
            score += 100;
            document.getElementById('score').innerText = 'Score: ' + score;
        }
    }
}

// Spawn New Block
function spawnNewBlock() {
    if (nextBlock) {
        currentBlock = nextBlock;
    } else {
        currentBlock = generateBlock();
    }
    nextBlock = generateBlock();
    // Position near top center
    currentBlock.position = {x: Math.floor(gridSize/2) - Math.ceil(currentBlock.shape[0][0].length/2), y: 0, z: Math.floor(gridSize/2) - Math.ceil(currentBlock.shape[0].length/2)};
    if (!isValidPosition()) {
        alert('Game Over! Final Score: ' + score);
        clearInterval(gameInterval);
        clearInterval(fallInterval);
    }
}

// Game Loop
function gameTick() {
    if (!gamePaused) {
        drop();
        drawGrid();
    }
}

// Start Game
function startGame() {
    initGrid();
    spawnNewBlock();
    gameInterval = setInterval(gameTick, currentSpeed);
    fallInterval = setInterval(() => {
        if (!gamePaused) {
            drop();
            drawGrid();
        }
    }, currentSpeed);
}

// Initialize Game
startGame();

// Additional UI controls, pause, reset, etc. can be added for complete functionality.