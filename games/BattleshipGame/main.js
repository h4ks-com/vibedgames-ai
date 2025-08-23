// JavaScript code for Battleship game

// Game configuration
const gridSize = 10;
const shipSizes = [5, 4, 3, 3, 2]; // Carrier, Battleship, Cruiser, Submarine, Destroyer
let currentPhase = 'placement'; // 'placement' or 'attack'
let currentPlayer = 1;
let currentShipIndex = 0;
let isVertical = false;
let gameStarted = false;

// Data structures
let playerGrids = {
    1: createEmptyGrid(),
    2: createEmptyGrid()
};
let playerShips = {
    1: [], // will contain objects {size: number, positions: [{row, col}], hits: number}
    2: []
};
let selectedShipPositions = [];

// References to DOM elements
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const rotateBtn = document.getElementById('rotateBtn');
const statusDiv = document.getElementById('status');
const player1GridDiv = document.getElementById('player1-grid');
const player2GridDiv = document.getElementById('player2-grid');
const player2AttackGridDiv = document.getElementById('player2-attack-grid');
const player1AttackGridDiv = document.getElementById('player1-attack-grid');

let isPlacingShip = true; // true during placement phase

// Initialize grids
function createEmptyGrid() {
    const grid = [];
    for (let i = 0; i < gridSize; i++) {
        const row = [];
        for (let j = 0; j < gridSize; j++) {
            row.push({hasShip: false, hit: false});
        }
        grid.push(row);
    }
    return grid;
}

// Render grids
function renderGrid(gridDiv, gridData, isPlayerGrid = false) {
    gridDiv.innerHTML = '';
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            // Differentiate based on phase and grid
            if (gridData[row][col].hit) {
                if (gridData[row][col].hasShip) {
                    cell.classList.add('hit');
                } else {
                    cell.classList.add('miss');
                }
            } else {
                if (gridData[row][col].hasShip && isPlayerGrid && currentPhase !== 'attack') {
                    cell.classList.add('ship');
                }
            }

            // Add event listeners during placement
            if (currentPhase === 'placement' && isPlayerGrid && currentPlayer === 1 && !gameStarted) {
                cell.addEventListener('click', placeShipHandler);
            }
            if (currentPhase === 'placement' && isPlayerGrid && currentPlayer === 2 && !gameStarted) {
                cell.addEventListener('click', placeShipHandler);
            }
            // Add attack event listener
            if (currentPhase === 'attack' && !isPlayerGrid) {
                cell.addEventListener('click', attackHandler);
            }
            gridDiv.appendChild(cell);
        }
    }
}

// Initial rendering
renderGrid(player1GridDiv, playerGrids[1], true);
renderGrid(player2GridDiv, playerGrids[2], true);
renderGrid(player2AttackGridDiv, createEmptyGrid()); // attack grid for player 1
renderGrid(player1AttackGridDiv, createEmptyGrid()); // attack grid for player 2

// Event handlers
startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetGame);
rotateBtn.addEventListener('click', () => {
    isVertical = !isVertical;
    updateStatus(
        `Ship orientation: ${isVertical ? 'Vertical' : 'Horizontal'}`
    );
});

function placeShipHandler(e) {
    if (currentPhase !== 'placement') return;
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    const size = shipSizes[currentShipIndex];

    // Calculate ship cells based on orientation
    const shipCells = [];
    for (let i = 0; i < size; i++) {
        const r = row + (isVertical ? i : 0);
        const c = col + (isVertical ? 0 : i);
        if (r >= gridSize || c >= gridSize) {
            updateStatus('Ship placement out of bounds. Try again.');
            return;
        }
        // Check overlaps
        if (playerGrids[currentPlayer][r][c].hasShip) {
            updateStatus('Overlap detected. Try again.');
            return;
        }
        shipCells.push({row: r, col: c});
    }
    // Place ship
    shipCells.forEach(cell => {
        playerGrids[currentPlayer][cell.row][cell.col].hasShip = true;
    });
    // Save ship
    playerShips[currentPlayer].push({size: size, positions: shipCells, hits: 0});
    // Render updated grid
    renderGrid(currentPlayer === 1 ? player1GridDiv : player2GridDiv, playerGrids[currentPlayer], true);
    // Move to next ship
    currentShipIndex++;
    if (currentShipIndex >= shipSizes.length) {
        // All ships placed for current player
        if (currentPlayer === 1) {
            currentPlayer = 2;
            currentShipIndex = 0;
            updateStatus('Player 2, place your ships.');
        } else {
            // Both players done with placement
            currentPhase = 'attack';
            updateStatus('All ships placed. Game begins! Player 1, attack now.');
            // Remove placement handlers
            removePlacementHandlers();
            // Enable attack grids
            renderGrid(player2AttackGridDiv, createEmptyGrid());
            renderGrid(player1AttackGridDiv, createEmptyGrid());
        }
    } else {
        updateStatus(`Place ship of size ${shipSizes[currentShipIndex]}`);
    }
}

function attackHandler(e) {
    if (currentPhase !== 'attack') return;
    if (currentPlayer === 1 && e.currentTarget.id !== 'player2-attack-grid') return;
    if (currentPlayer === 2 && e.currentTarget.id !== 'player1-attack-grid') return;

    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);

    // Identify opponent grid
    const opponentGrid = currentPlayer === 1 ? playerGrids[2] : playerGrids[1];
    const attackGridDiv = currentPlayer === 1 ? document.getElementById('player2-attack-grid') : document.getElementById('player1-attack-grid');
    const attackGridData = (currentPlayer === 1 ? player2AttackGridDiv : player1AttackGridDiv).children;

    // Check if already targeted
    if (opponentGrid[row][col].hit) {
        updateStatus('Cell already targeted. Choose another.');
        return;
    }
    // Register hit or miss
    opponentGrid[row][col].hit = true;
    // Update attack grid visual
    const index = row * gridSize + col;
    const cellDiv = attackGridDiv.children[index];
    if (opponentGrid[row][col].hasShip) {
        cellDiv.classList.add('hit');
        updateStatus('Hit!');
        // Check if ship is sunk
        checkShipSunk(row, col, opponentGrid, currentPlayer);
        if (checkGameOver(currentPlayer === 1 ? 2 : 1)) {
            updateStatus(`Player ${currentPlayer} wins!`);
            disableAll();
            return;
        }
    } else {
        cellDiv.classList.add('miss');
        updateStatus('Miss!');
    }
    // Switch turn
    switchPlayer();
}

function checkShipSunk(row, col, grid, player) {
    // Find the ship that has this cell
    const ship = playerShips[player].find(s => {
        return s.positions.some(pos => pos.row === row && pos.col === col);
    });
    // Check if all parts are hit
    if (ship) {
        const allHit = ship.positions.every(pos => grid[pos.row][pos.col].hit);
        if (allHit && ship.hits !== 1) {
            ship.hits = 1;
            updateStatus(`Ship of size ${ship.size} sunk!`);
        }
    }
}

function checkGameOver(player) {
    // Check if all ships are sunk
    return playerShips[player].every(ship => {
        return ship.positions.every(pos => playerGrids[player][pos.row][pos.col].hit);
    });
}

function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateStatus(`Player ${currentPlayer}'s turn`);
}

function updateStatus(message) {
    statusDiv.textContent = message;
}

function resetGame() {
    // Reset all data
    playerGrids = {
        1: createEmptyGrid(),
        2: createEmptyGrid()
    };
    playerShips = {
        1: [],
        2: []
    };
    currentPhase = 'placement';
    currentPlayer = 1;
    currentShipIndex = 0;
    isVertical = false;
    gameStarted = false;
    // Rerender grids
    renderGrid(player1GridDiv, playerGrids[1], true);
    renderGrid(player2GridDiv, playerGrids[2], true);
    renderGrid(player2AttackGridDiv, createEmptyGrid());
    renderGrid(player1AttackGridDiv, createEmptyGrid());
    updateStatus('Place your ships to start the game');
    // Remove event listeners
    removePlacementHandlers();
}

function removePlacementHandlers() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.replaceWith(cell.cloneNode(true)); // Remove all event listeners
    });
}

// Start game
function startGame() {
    if (playerShips[1].length !== shipSizes.length || playerShips[2].length !== shipSizes.length) {
        alert('Please place all ships for both players before starting the game.');
        return;
    }
    currentPhase = 'attack';
    updateStatus('Game started! Player 1, attack now.');
    // Remove placement handlers
    removePlacementHandlers();
}

// Initial instruction
updateStatus('Place your ships to start the game');

// Additional code for responsiveness and accessibility improvements can be added as needed.  
