const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sizeDisplay = document.getElementById('sizeDisplay');
const foodCountDisplay = document.getElementById('foodCount');
const stageDisplay = document.getElementById('stageDisplay');
const restartBtn = document.getElementById('restartBtn');
const speedUpBtn = document.getElementById('speedUpBtn');
const speedDownBtn = document.getElementById('speedDownBtn');
const toggleAnimationBtn = document.getElementById('toggleAnimationBtn');

let animationsEnabled = true;
let gameSpeedMultiplier = 1;

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
  speed: 2.5,
  segments: 7,
  direction: {x: 1, y: 0},
  size: 1,
  eaten: 0,
  colors: Array.from({length: 50}, (_,i) => `hsl(${i*7 % 360}, 70%, 50%)`),
  colorIndex: 0
};

const collectibles = [];
const growthThresholds = [5, 15, 30];
let currentStage = 0;

function init() {
  caterpillar.x = canvas.width / 2;
  caterpillar.y = canvas.height / 2;
  caterpillar.segments = 7;
  caterpillar.size = 1;
  caterpillar.eaten = 0;
  currentStage = 0;
  updateStageDisplay();
  collectibles.length = 0;
  for (let i=0; i<12; i++) { spawnCollectible(); }
  sizeDisplay.textContent = caterpillar.size.toFixed(1);
  foodCountDisplay.textContent = caterpillar.eaten;
  stageDisplay.textContent = getStageName();
}

function getStageName() {
  if (currentStage === 0) return 'Hatchling';
  if (currentStage === 1) return 'Larva';
  if (currentStage === 2) return 'Pupa';
  if (currentStage === 3) return 'Butterfly';
  return 'Adult';
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
    rotation: Math.random() * Math.PI * 2,
    pulsate: Math.random() < 0.4
  });
}

function drawCollectibles() {
  collectibles.forEach(c => {
    ctx.save();
    ctx.translate(c.x + c.size/2, c.y + c.size/2);
    ctx.rotate(c.rotation);
    const scale = c.pulsate ? 1 + Math.sin(Date.now() / 250 + c.x + c.y) * 0.3 : 1;
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = c.type === 'leaf' ? '#81c784' : '#f06292';
    ctx.beginPath();
    ctx.arc(0, 0, c.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup', e => { keys[e.key] = false; });

restartBtn.addEventListener('click', () => { init(); });
speedUpBtn.addEventListener('click', () => { gameSpeedMultiplier = Math.min(gameSpeedMultiplier + 0.5, 3); });
speedDownBtn.addEventListener('click', () => { gameSpeedMultiplier = Math.max(gameSpeedMultiplier - 0.5, 0.5); });
toggleAnimationBtn.addEventListener('click', () => { animationsEnabled = !animationsEnabled; });

function gameLoop() {
  const startTime = performance.now();
  function step(currentTime) {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (performance.now() - startTime < 1000 / (60 * gameSpeedMultiplier)) {
      requestAnimationFrame(step);
      return;
    }
    if (keys['ArrowUp'] || keys['w']) { caterpillar.y -= caterpillar.speed; }
    if (keys['ArrowDown'] || keys['s']) { caterpillar.y += caterpillar.speed; }
    if (keys['ArrowLeft'] || keys['a']) { caterpillar.x -= caterpillar.speed; }
    if (keys['ArrowRight'] || keys['d']) { caterpillar.x += caterpillar.speed; }
    caterpillar.x = Math.max(0, Math.min(canvas.width, caterpillar.x));
    caterpillar.y = Math.max(0, Math.min(canvas.height, caterpillar.y));
    drawBackground();
    drawCollectibles();
    drawCaterpillar();
    checkCollection();
    sizeDisplay.textContent = caterpillar.size.toFixed(1);
    foodCountDisplay.textContent = caterpillar.eaten;
    updateStage();
    if (animationsEnabled) { caterpillar.colorIndex = (caterpillar.colorIndex + 1) % caterpillar.colors.length; }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#e0f7fa');
  gradient.addColorStop(1, '#b2ebf2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for(let i=0; i<100; i++) {
    ctx.fillStyle = `rgba(255,255,255,${(0.02 + 0.03*Math.random())})`;
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random()*3, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawCaterpillar() {
  ctx.save();
  ctx.translate(caterpillar.x, caterpillar.y);
  ctx.fillStyle = '#4CAF50';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(0, 0, 12 + caterpillar.size * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  for (let i=1; i< caterpillar.segments; i++) {
    ctx.beginPath();
    ctx.arc(-i*14, 0, 10 + caterpillar.size, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(-i*14, 0, 5, -i*14, 0, 10 + caterpillar.size);
    const hueShift = Math.floor(caterpillar.colorIndex);  
    gradient.addColorStop(0, `hsl(${(120 + hueShift) % 360}, 70%, 50%)`);
    gradient.addColorStop(1, `hsl(${(120 + hueShift + 30) % 360}, 70%, 30%)`);
    ctx.fillStyle = gradient;
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
    if (dist < c.size/2 + 12 + caterpillar.size * 2) {
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
  stageDisplay.textContent = getStageName();
}

init();

gameLoop();