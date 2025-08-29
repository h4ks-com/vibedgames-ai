// Main game script
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas
function resizeCanvas() {
  // Set fixed size for icons, e.g., 64x64, with scaling for responsiveness
  const size = 64; // Base size for icon
  canvas.width = size;
  canvas.height = size;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Draw robot icon
const robot = {
  x: 32,
  y: 32,
  width: 24,
  height: 30,
  color: '#A0C4FF',
  draw: function() {
    ctx.fillStyle = this.color;
    // Head
    ctx.beginPath();
    ctx.arc(this.x, this.y - 10, 12, Math.PI, 2 * Math.PI); // Rounded head
    ctx.fill();
    // Body
    ctx.fillRect(this.x - 6, this.y, 12, 20); // Centered body
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x - 4, this.y - 4, 3, 0, Math.PI * 2); // Left eye
    ctx.arc(this.x + 4, this.y - 4, 3, 0, Math.PI * 2); // Right eye
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.x - 4, this.y - 4, 1.5, 0, Math.PI * 2); // Left eye shine
    ctx.arc(this.x + 4, this.y - 4, 1.5, 0, Math.PI * 2); // Right eye shine
    ctx.fill();
    // Antenna
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 12);
    ctx.lineTo(this.x, this.y - 18);
    ctx.stroke();
  }
};

// Draw background with pastel gradient and subtle texture
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#ffe4e1'); // Pastel pink
  gradient.addColorStop(1, '#b0e0e6'); // Pastel blue
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle pattern for texture
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  robot.draw();
}

function gameLoop() {
  draw();
  requestAnimationFrame(gameLoop);
}

// Initialize canvas with fixed size for icons
resizeCanvas();
gameLoop();