const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sizeDisplay = document.getElementById('sizeDisplay');
const foodCountDisplay = document.getElementById('foodCount');
const stageDisplay = document.getElementById('stageDisplay');
const restartBtn = document.getElementById('restartBtn');

function resizeCanvas() {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.6;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let gameRunning = true;
const keys = {};

let caterpillar = {
  x: 0,
  y: 0,
  speed: 2,
  segments: 5,
  direction: {x: 1, y: 0},
  size: 1,
  eaten: 0,
};

const collectibles = [];
const growthThresholds = [5, 15, 30];
let currentStage = 0;

function init() {
  caterpillar.x = canvas.width / 2;
  caterpillar.y = canvas.height / 2;
  caterpillar.segments = 5;
  caterpillar.size = 1;
  caterpillar.eaten = 0;
  currentStage = 0;
  updateStageDisplay();
  collectibles.length = 0;
  for(let i=0; i<10; i++) { spawnCollectible(); }
  sizeDisplay.textContent = caterpillar.size;
  foodCountDisplay.textContent = caterpillar.eaten;
  stageDisplay.textContent = getStageName();
}

function getStageName() {
  if (currentStage === 0) return 'Hatchling';
  if (currentStage === 1) return 'Larva';
  if (currentStage === 2) return 'Pupa';
  if (currentStage === 3) return 'Butterfly';
  return '';
}

function updateStageDisplay() {
  stageDisplay.textContent = getStageName();
}

function spawnCollectible() {
  const size = 20 + Math.random() * 20;
  collectibles.push({
    x: Math.random() * (canvas.width - size),
    y: Math.random() * (canvas.height - size),
    size: size,
    type: Math.random() < 0.7 ? 'leaf' : 'flower',
  });
}

function drawCollectibles() {
  collectibles.forEach(c => {
    ctx.fillStyle = c.type === 'leaf' ? '#81c784' : '#f06292';
    ctx.beginPath();
    ctx.arc(c.x + c.size/2, c.y + c.size/2, c.size/2, 0, Math.PI*2);
    ctx.fill();
  });
}

document.addEventListener('keydown', e => {
  keys[e.key] = true;
});
document.addEventListener('keyup', e => {
  keys[e.key] = false;
});

restartBtn.addEventListener('click', () => { init(); });

function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (keys['ArrowUp'] || keys['w']) { caterpillar.y -= caterpillar.speed; }
  if (keys['ArrowDown'] || keys['s']) { caterpillar.y += caterpillar.speed; }
  if (keys['ArrowLeft'] || keys['a']) { caterpillar.x -= caterpillar.speed; }
  if (keys['ArrowRight'] || keys['d']) { caterpillar.x += caterpillar.speed; }
  caterpillar.x = Math.max(0, Math.min(canvas.width, caterpillar.x));
  caterpillar.y = Math.max(0, Math.min(canvas.height, caterpillar.y));
  ctx.fillStyle = '#d0f4f7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCollectibles();
  drawCaterpillar();
  checkCollection();
  sizeDisplay.textContent = caterpillar.size.toFixed(1);
  foodCountDisplay.textContent = caterpillar.eaten;
  updateStage();
  requestAnimationFrame(gameLoop);
}

function drawCaterpillar() {
  ctx.save();
  ctx.translate(caterpillar.x, caterpillar.y);
  ctx.fillStyle = '#558b2f';
  ctx.beginPath();
  ctx.arc(0, 0, 10 + caterpillar.size * 2, 0, Math.PI*2);
  ctx.fill();
  for (let i=1; i< caterpillar.segments; i++) {
    ctx.beginPath();
    ctx.arc(-i*12, 0, 8 + caterpillar.size, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function checkCollection() {
  for (let i=collectibles.length-1; i>=0; i--) {
    const c = collectibles[i];
    const dx = c.x + c.size/2 - caterpillar.x;
    const dy = c.y + c.size/2 - caterpillar.y;
    const dist = Math.hypot(dx, dy);
    if (dist < c.size/2 + 10 + caterpillar.size * 2) {
      collectibles.splice(i,1);
      caterpillar.eaten++;
      if (c.type === 'leaf') { caterpillar.size += 0.1; }
      else if (c.type === 'flower') { caterpillar.size += 0.2; }
      checkGrowth();
      spawnCollectible();
    }
  }
}

function checkGrowth() {
  if (currentStage < growthThresholds.length && caterpillar.eaten >= growthThresholds[currentStage]) {
    currentStage++;
    updateStage();
  }
}

function updateStage() {
  if (currentStage >= growthThresholds.length+1) { currentStage = growthThresholds.length; }
  updateStageDisplay();
}

init();
gameLoop();