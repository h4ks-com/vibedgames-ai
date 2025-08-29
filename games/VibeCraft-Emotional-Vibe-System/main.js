const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Emotions and system state
const emotions = {
  happiness: 0,
  sadness: 0,
  anger: 0,
  calmness: 0,
  anxiety: 0
};

let emotionDecayRate = 0.01;

// Function to modify emotions based on events
function modifyEmotion(emotion, amount) {
  if (emotions.hasOwnProperty(emotion)) {
    emotions[emotion] += amount;
    // Clamp between 0 and 1
    emotions[emotion] = Math.min(Math.max(emotions[emotion], 0), 1);
  }
}

// Example interaction: player makes a decision
function playerDecision(decisionType) {
  // Decisions affect emotions
  if (decisionType === 'kind') {
    modifyEmotion('happiness', 0.2);
    modifyEmotion('anger', -0.1);
  } else if (decisionType === 'hostile') {
    modifyEmotion('anger', 0.3);
    modifyEmotion('calmness', -0.2);
  }
}

// Visual representation of emotions
function drawEmotionAura() {
  // Determine dominant emotion for aura color
  const maxEmotion = Object.keys(emotions).reduce((a, b) => emotions[a] > emotions[b] ? a : b);
  let color = '#FFFFFF';
  switch (maxEmotion) {
    case 'happiness': color = '#FFFF99'; break;
    case 'sadness': color = '#6699FF'; break;
    case 'anger': color = '#FF6666'; break;
    case 'calmness': color = '#66CCCC'; break;
    case 'anxiety': color = '#CC66FF'; break;
  }
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, Math.max(...Object.values(emotions)) * 200 + 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// Drawing characters
function drawCharacter() {
  // Simple humanoid figure with detailed look
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2 + 100;

  // Head
  ctx.fillStyle = '#ffe0bd';
  ctx.beginPath();
  ctx.arc(centerX, centerY - 100, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#654321'; // hair color
  ctx.lineWidth = 4;
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(centerX - 15, centerY - 110, 5, 0, Math.PI * 2);
  ctx.arc(centerX + 15, centerY - 110, 5, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#3399FF';
  ctx.fillRect(centerX - 20, centerY - 60, 40, 80);

  // Arms
  ctx.strokeStyle = '#ffe0bd';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(centerX - 20, centerY - 50);
  ctx.lineTo(centerX - 60, centerY);
  ctx.moveTo(centerX + 20, centerY - 50);
  ctx.lineTo(centerX + 60, centerY);
  ctx.stroke();

  // Legs
  ctx.beginPath();
  ctx.moveTo(centerX - 10, centerY + 20);
  ctx.lineTo(centerX - 10, centerY + 80);
  ctx.moveTo(centerX + 10, centerY + 20);
  ctx.lineTo(centerX + 10, centerY + 80);
  ctx.stroke();
}

// Main game loop
function gameLoop() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawEmotionAura();
  drawCharacter();

  // Decay emotions over time
  for (let key in emotions) {
    emotions[key] -= emotionDecayRate;
    emotions[key] = Math.max(emotions[key], 0);
  }

  requestAnimationFrame(gameLoop);
}

// Example interactions
window.addEventListener('keydown', (e) => {
  if (e.key === 'h') { playerDecision('kind'); } // Player presses 'h'
  if (e.key === 'j') { playerDecision('hostile'); } // Player presses 'j'
});

gameLoop();