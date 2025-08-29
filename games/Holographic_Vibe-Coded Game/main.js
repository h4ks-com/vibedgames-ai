const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startGame');
const statusDiv = document.getElementById('status');

// Adjust canvas size for high-res vibrancy
function resizeCanvas() {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.8;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let gameActive = false;
let currentVibe = null;
const vibes = {
  NeonPulse: {
    hueShiftSpeed: 1.0,
    shimmerIntensity: 1.0,
    palette: ['#ff00ff', '#00ffff', '#ffff00', '#ff8800'],
  },
  CosmicGlow: {
    hueShiftSpeed: 0.5,
    shimmerIntensity: 1.2,
    palette: ['#66ccff', '#ff66ff', '#66ffcc', '#ffcc66'],
  },
  AuroraForce: {
    hueShiftSpeed: 0.8,
    shimmerIntensity: 0.8,
    palette: ['#ff9999', '#99ff99', '#9999ff', '#ffff99'],
  }
};

// Initialize preferred vibe
let currentVibe = null;

const particles = [];
const maxParticles = 150;
function initParticles() {
  for(let i=0;i<maxParticles;i++){
    particles.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      size: Math.random()*3+1,
      dx: (Math.random()-0.5)*2,
      dy: (Math.random()-0.5)*2,
      alpha: Math.random()
    });
  }
}
initParticles();

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha=p.alpha;
    ctx.fillStyle = '#fff'; // Particles shimmer with white
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    p.alpha *= 0.99;
    if(p.x<0 || p.x>canvas.width || p.y<0 || p.y>canvas.height || p.alpha<0.05){
      p.x = Math.random()*canvas.width;
      p.y = Math.random()*canvas.height;
      p.alpha = Math.random();
    }
  });
}

function handleResize() {
  resizeCanvas();
}

startBtn.onclick = () => {
  // Cycle through vibes
  if (!currentVibe || currentVibe===vibes.AuroraForce) {
    currentVibe = vibes.NeonPulse;
  } else if (currentVibe===vibes.NeonPulse) {
    currentVibe = vibes.CosmicGlow;
  } else {
    currentVibe = vibes.AuroraForce;
  }
  gameActive=true;
  statusDiv.innerText='Vibe Activated!';
  score=0;
  updateScore();
  requestAnimationFrame(renderGame);
};

let score=0;
function updateScore() {
  document.getElementById('score')?.innerText= `Score: ${score}`;
}

function renderGame() {
  if (!gameActive) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Dynamic animated iridescent background
  const hueOffset = Date.now() * (currentVibe ? currentVibe.hueShiftSpeed : 0) / 1000;
  ctx.fillStyle = `hsl(${hueOffset % 360}, 70%, 50%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw shimmering particles
  drawParticles();
  // Optional overlay glow
  if(currentVibe) {
    ctx.shadowBlur=80;
    ctx.shadowColor=currentVibe.palette[Math.floor(Date.now()/100)%currentVibe.palette.length];
  }
  ctx.globalAlpha=1;
  requestAnimationFrame(renderGame);
}

canvas.onclick = (e) => {
  if (!gameActive) return;
  score+=5;
  updateScore();
  for(let i=0;i<10;i++){
    particles.push({
      x: e.offsetX,
      y: e.offsetY,
      size: Math.random()*2+1,
      dx: (Math.random() - 0.5)*3,
      dy: (Math.random() - 0.5)*3,
      alpha: 1
    });
  }
};

window.addEventListener('resize', handleResize);
// Initialize
resizeCanvas();
renderGame();