// main.js
const display = document.getElementById('gameConsole');
let gameState = {
  player: { x: 10, y: 10, artIndex: 0, health: 10 },
  environment: [],
  msg: 'Welcome to ASCII Bear Quest!',
  inventory: [],
  questLog: [],
  environmentState: {},
  gameFlags: {}
};

// ASCII art assets for the bear with animated variants
const asciiBear = [
`ʕ•ᴥ•ʔ`,
`/|\`,
`/ \`
];
// You can add more variants for walking, sitting, etc.

// Environment tiles with symbols and colors
const envTiles = {
  "tree": { symbol: `🌳`, color: `#2e7d32` },
  "mountain": { symbol: `⛰️`, color: `#555` },
  "cave": { symbol: `🕳️`, color: `#8d6e63` },
  "water": { symbol: `💧`, color: `#2196f3` },
  "treasure": { symbol: `💰`, color: `#ffd700` }
};

// Initialize environment grid with textures and objects
function initEnv() {
  for (let y = 0; y < 20; y++) {
    gameState.environment[y] = [];
    for (let x = 0; x < 40; x++) {
      if (y === 0 || y === 19 || x === 0 || x === 39) {
        gameState.environment[y][x] = { symbol: '#', color: '#555' };
      } else if (y === 5 && x === 5) {
        gameState.environment[y][x] = { symbol: envTiles['tree'].symbol, color: envTiles['tree'].color };
      } else if (y === 10 && x === 15) {
        gameState.environment[y][x] = { symbol: envTiles['cave'].symbol, color: envTiles['cave'].color };
      } else if (y === 12 && x === 20) {
        gameState.environment[y][x] = { symbol: envTiles['treasure'].symbol, color: envTiles['treasure'].color };
      } else if (y > 8 && y < 13 && x > 10 && x < 25) {
        gameState.environment[y][x] = { symbol: envTiles['water'].symbol, color: envTiles['water'].color };
      } else {
        gameState.environment[y][x] = { symbol: '.', color: '#cccccc' };
      }
    }
  }
}

// Render environment with ASCII art character and UI
function render() {
  let output = '';
  for (let y = 0; y < gameState.environment.length; y++) {
    for (let x = 0; x < gameState.environment[y].length; x++) {
      if (x === gameState.player.x && y === gameState.player.y) {
        // Draw ASCII bear with color
        output += `<span style="color:#d32f2f">${asciiBear[gameState.player.artIndex]}</span>`;
      } else {
        const tile = gameState.environment[y][x];
        output += `<span style="color:${tile.color}">${tile.symbol}</span>`;
      }
    }
    output += '\n';
  }
  // Optional: Show Health and Inventory
  output += `\nHealth: ${gameState.player.health}`;
  output += `\nInventory: ${gameState.inventory.join(', ')}`;
  output += `\nQuest Log: ${gameState.questLog.join('; ')}`;
  // Append message
  output += `\n${gameState.msg}`;
  display.innerHTML = output;
}

// Handle keyboard input for movement, actions, save/load
document.addEventListener('keydown', (e) => {
  const { x, y } }= gameState.player;
  const maxY = gameState.environment.length - 1;
  const maxX = gameState.environment[0].length - 1;
  let newX = x;
  let newY = y;
  switch(e.key) {
    case 'ArrowUp':
      newY = y > 1 ? y - 1 : y;
      break;
    case 'ArrowDown':
      newY = y < maxY - 1 ? y + 1 : y;
      break;
    case 'ArrowLeft':
      newX = x > 1 ? x - 1 : x;
      break;
    case 'ArrowRight':
      newX = x < maxX - 1 ? x + 1 : x;
      break;
    case 'a': // Attack toggle animation
      gameState.player.artIndex = (gameState.player.artIndex + 1) % asciiBear.length;
      gameState.msg = 'You attack!';
      break;
    case 's': // Save
      localStorage.setItem('asciiQuestSave', JSON.stringify(gameState));
      gameState.msg = 'Game Saved!';
      break;
    case 'l': // Load
      const save = localStorage.getItem('asciiQuestSave');
      if (save) {
        gameState = JSON.parse(save);
        gameState.msg = 'Game Loaded!';
      } else {
        gameState.msg = 'No save found!';
      }
      break;
    default:
      gameState.msg = 'Use arrow keys to move, a to attack, s to save, l to load.';
  }
  // Check collisions (walls)
  if (gameState.environment[newY][newX].symbol !== '#') {
    gameState.player.x = newX;
    gameState.player.y = newY;
    // Check interactions with environment objects
    const currentTile = gameState.environment[newY][newX];
    if (currentTile.symbol === envTiles['treasure'].symbol) {
      gameState.msg = 'You found a treasure!';
      // Add to inventory or trigger quest
      gameState.inventory.push('Treasure');
      // Remove treasure from environment
      gameState.environment[newY][newX] = { symbol: '.', color: '#cccccc' };
    }
  } else {
    gameState.msg = 'Blocked by something!';
  }
  render();
});

// Initialize environment and render on load
initEnv();
render();