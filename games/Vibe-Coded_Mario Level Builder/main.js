// Main JavaScript for Mario Level Builder
// Basic setup and structure

// Initialize variables
const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');

const levelObjects = [];
let currentTool = 'block';

// Tool buttons
document.getElementById('blockTool').addEventListener('click', () => { currentTool = 'block'; });
document.getElementById('enemyTool').addEventListener('click', () => { currentTool = 'enemy'; });
document.getElementById('powerUpTool').addEventListener('click', () => { currentTool = 'powerUp'; });
document.getElementById('environmentTool').addEventListener('click', () => { currentTool = 'environment'; });

// Canvas click event to place objects
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  // Create object based on current tool
  let obj = { type: currentTool, x: x, y: y };
  // For simplicity, assign default sizes and properties per type
  switch(currentTool) {
    case 'block':
      obj.width = 40;
      obj.height = 40;
      obj.color = '#8B4513'; // Brown
      break;
    case 'enemy':
      obj.width = 30;
      obj.height = 30;
      obj.color = '#FF0000'; // Red
      obj.name = 'Goomba';
      break;
    case 'powerUp':
      obj.width = 20;
      obj.height = 20;
      obj.color = '#FFD700'; // Gold
      obj.name = 'Mushroom';
      break;
    case 'environment':
      obj.width = 50;
      obj.height = 10;
      obj.color = '#228B22'; // Forest Green
      break;
  }
  levelObjects.push(obj);
  drawLevel();
});

// Draw all objects on the canvas
function drawLevel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  levelObjects.forEach(obj => {
    ctx.fillStyle = obj.color;
    ctx.fillRect(obj.x - obj.width/2, obj.y - obj.height/2, obj.width, obj.height);
  });
}

// Save level data
document.getElementById('saveLevelBtn').addEventListener('click', () => {
  const levelDataTextarea = document.getElementById('levelData');
  levelDataTextarea.value = JSON.stringify(levelObjects);
});

// Load level data
document.getElementById('loadLevelBtn').addEventListener('click', () => {
  const data = prompt('Paste your level JSON data here:');
  try {
    const loadedObjects = JSON.parse(data);
    if (Array.isArray(loadedObjects)) {
      levelObjects.length = 0;
      loadedObjects.forEach(obj => {
        // Basic validation could be added here
        levelObjects.push(obj);
      });
      drawLevel();
    } else {
      alert('Invalid data format');
    }
  } catch (e) {
    alert('Invalid JSON');
  }
});

// Vibe customization
const vibePanel = document.getElementById('vibePanel');
const vibeBtn = document.getElementById('vibeSettingsBtn');
const applyVibeBtn = document.getElementById('applyVibeBtn');
const closeVibeBtn = document.getElementById('closeVibeBtn');

vibeBtn.addEventListener('click', () => {
  vibePanel.classList.remove('hidden');
});

applyVibeBtn.addEventListener('click', () => {
  const bgColor = document.getElementById('bgColor').value;
  document.body.style.background = bgColor;
  // Additional vibe settings like music and particles can be integrated here
  vibePanel.classList.add('hidden');
});

closeVibeBtn.addEventListener('click', () => {
  vibePanel.classList.add('hidden');
});

// Preview Level
const previewPanel = document.getElementById('previewPanel');
const previewBtn = document.getElementById('previewBtn');
const exitPreviewBtn = document.getElementById('exitPreviewBtn');
const gameCanvas = document.getElementById('gamePreview');
const gameCtx = gameCanvas.getContext('2d');

previewBtn.addEventListener('click', () => {
  // Switch to preview panel
  document.getElementById('main').innerHTML = '';
  // Copy gamePreview canvas for rendering
  document.getElementById('previewPanel').classList.remove('hidden');
  renderGame();
});

exitPreviewBtn.addEventListener('click', () => {
  document.getElementById('previewPanel').classList.add('hidden');
});

// Render game for preview
function renderGame() {
  // Basic rendering: draw objects in a dynamic scene
  function draw() {
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    levelObjects.forEach(obj => {
      // For preview, animate enemies or effects if desired
      gameCtx.fillStyle = obj.color;
      gameCtx.fillRect(obj.x - obj.width/2, obj.y - obj.height/2, obj.width, obj.height);
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// Share level data
document.getElementById('shareBtn').addEventListener('click', () => {
  const levelDataTextarea = document.getElementById('levelData');
  document.getElementById('levelData').value = JSON.stringify(levelObjects);
  document.getElementById('sharePanel').classList.remove('hidden');
});

// Copy level data
document.getElementById('copyLevelData').addEventListener('click', () => {
  const levelData = document.getElementById('levelData');
  levelData.select();
  document.execCommand('copy');
  alert('Level data copied!');
});

// Close share panel
document.getElementById('closeShareBtn').addEventListener('click', () => {
  document.getElementById('sharePanel').classList.add('hidden');
});

// Additional enhancements such as better object editing, object properties, sound integration, and vibe effects can be added for a richer experience.
