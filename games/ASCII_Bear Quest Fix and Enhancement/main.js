// main.js
const display = document.getElementById('gameConsole');
const isWindows = navigator.appVersion.indexOf('Win') !== -1;
let gameState = {
  player: { x: 10, y: 10, artIndex: 0 },
  environment: [],
  msg: 'Welcome to ASCII Bear Quest!'
};

// Proper ASCII art of the bear with color annotations, escape sequences handled appropriately
const asciiBear = [`<span style="color:#FFC896">(\_\ )</span>`, // Light brown
`<span style="color:#FFC896">(o.o)</span>`,
`<span style="color:#FFC896"> >^< </span>`];

const envTiles = {
  "tree": `<span style="color:#28a745">🌳</span>`,
  "mountain": `<span style="color:#1e90ff">⛰️</span>`,
  "cave": `<span style="color:#D2B48C">🕳️</span>`,
  "water": `<span style="color:#17d4d4">💧</span>`,
  "treasure": `<span style="color:#D4AF37">💰</span>`
};

// Initialize environment with textures and colors
function initEnv() {
  for (let y = 0; y < 20; y++) {
    gameState.environment[y] = [];
    for (let x = 0; x < 40; x++) {
      if (y === 0 || y === 19 || x === 0 || x === 39) {
        gameState.environment[y][x] = `<span style="color:#555">#</span>`; // Wall with grey color
      } else if (y === 5 && x === 5) {
        gameState.environment[y][x] = envTiles['tree'];
      } else if (y === 10 && x === 15) {
        gameState.environment[y][x] = envTiles['cave'];
      } else if (y === 12 && x === 20) {
        gameState.environment[y][x] = envTiles['treasure'];
      } else if (y > 8 && y < 13 && x > 10 && x < 25) {
        gameState.environment[y][x] = envTiles['water'];
      } else {
        gameState.environment[y][x] = `<span style="color:#ccc">.</span>`;
      }
    }
  }
}

// Render environment with player
function render() {
  let output = '';
  for (let y = 0; y < gameState.environment.length; y++) {
    for (let x = 0; x < gameState.environment[y].length; x++) {
      if (x === gameState.player.x && y === gameState.player.y) {
        // Draw ASCII bear with colored span, ensuring '-' and '\' are escaped properly
        output += `<span style="color:#FFC896;">${asciiBear[gameState.player.artIndex]}</span>`;
      } else {
        output += gameState.environment[y][x];
      }
    }
    output += '\n';
  }
  output += '\n' + gameState.msg;
  display.innerHTML = output;
}

// Handle input for movement and actions
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowUp':
      if (gameState.environment[gameState.player.y - 1][gameState.player.x].includes('#')) {
        gameState.msg = 'You hit a wall!';
      } else {
        gameState.player.y--;
        gameState.msg = 'Moved Up';
      }
      break;
    case 'ArrowDown':
      if (gameState.environment[gameState.player.y + 1][gameState.player.x].includes('#')) {
        gameState.msg = 'You hit a wall!';
      } else {
        gameState.player.y++;
        gameState.msg = 'Moved Down';
      }
      break;
    case 'ArrowLeft':
      if (gameState.environment[gameState.player.y][gameState.player.x - 1].includes('#')) {
        gameState.msg = 'You hit a wall!';
      } else {
        gameState.player.x--;
        gameState.msg = 'Moved Left';
      }
      break;
    case 'ArrowRight':
      if (gameState.environment[gameState.player.y][gameState.player.x + 1].includes('#')) {
        gameState.msg = 'You hit a wall!';
      } else {
        gameState.player.x++;
        gameState.msg = 'Moved Right';
      }
      break;
    case 'a': // Attack or change appearance
      gameState.artIndex = (gameState.artIndex + 1) % asciiBear.length;
      gameState.msg = 'Attacking!';
      break;
    case 's': // Save game
      localStorage.setItem('asciiQuestSave', JSON.stringify(gameState));
      gameState.msg = 'Game Saved!';
      break;
    case 'l': // Load game
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
  render();
});

// Initialize game
initEnv();
render();