// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startBtn');
const reputationDisplay = document.getElementById('reputation');
const missionDisplay = document.getElementById('mission');
const stealthBar = document.getElementById('stealthBar');
const alertsArea = document.getElementById('alerts');

// Game state variables
let gameStatus = 'menu'; // menu, playing, paused, over
let reputationScore = 100;
let currentMissionIdx = 0;
const missions = [
  {name: 'Infiltrate Mainframe', description: 'Bypass security systems', difficulty: 2},
  {name: 'Extract Data', description: 'Steal confidential files', difficulty: 3},
  {name: 'Cover Tracks', description: 'Erase digital footprints', difficulty: 2}
];

// Stealth mechanics
let stealthLevel = 100; // 0-100
let detectionLevel = 0; // 0-100

// Canvas resize handling
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Start button event
startButton.addEventListener('click', () => {
  gameStatus='playing';
  loadMission(currentMissionIdx);
  gameLoop();
});

// Load the current mission
function loadMission(index) {
  if(index >= missions.length) {
    endGame();
    return;
  }
  document.getElementById('mission').textContent='Mission: '+missions[index].name;
  log('Starting: '+missions[index].description);
  // Reset stealth/detection
  stealthLevel=100;
  detectionLevel=0;
  updateStealthDisplay();
  updateAlerts('Mission started: '+missions[index].name);
}

// Main game loop
function gameLoop() {
  if(gameStatus !== 'playing') return;
  ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
  drawBackground();
  handleStealth();
  // Placeholder for hacking mechanics
  handleHackingPuzzles();
  checkDetection();
  requestAnimationFrame(gameLoop);
}

// Draw environment
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, '#0e1e3c');
  gradient.addColorStop(1, '#1e2a58');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  // Example city buildings
  ctx.fillStyle='#444';
  for(let i=0; i<Math.ceil(window.innerWidth/80); i++) {
    const height=80+Math.random()*120;
    ctx.fillRect(i*100, window.innerHeight - height, 60, height);
  }
}

// Handle stealth logic
function handleStealth() {
  stealthLevel -= Math.random()*0.1; // Gradually decrease stealth
  stealthLevel = Math.max(0, Math.min(100, stealthLevel));
  updateStealthBar();
}

// Update stealth bar UI
function updateStealthBar() {
  stealthBar.style.width = stealthLevel + '%';
  if(stealthLevel>50) {
    stealthBar.style.backgroundColor='#0f0';
    updateAlerts('Status: Hidden');
  } else if(stealthLevel>20) {
    stealthBar.style.backgroundColor='#ff0';
    updateAlerts('Status: Caution');
  } else {
    stealthBar.style.backgroundColor='#f00';
    updateAlerts('Status: Exposed!');
  }
}

// Placeholder for puzzles/equipment
function handleHackingPuzzles() {
  // Would contain mini-games or challenge triggers
}

// Check if spotted/detected
function checkDetection() {
  if(stealthLevel<20 && detectionLevel<100) {
    detectionLevel += 0.3;
    if(detectionLevel >= 100) {
      updateAlerts('Detected! Mission failed');
      updateReputation(-15);
      endGame(false);
    }
  }
}

function updateReputation(points) {
  reputationScore += points;
  reputationScore = Math.max(0, Math.min(100, reputationScore));
  reputationDisplay.textContent='Reputation: '+reputationScore;
}

function endGame(success=true) {
  gameStatus='over';
  alert(success ? 'Mission accomplished!' : 'You got caught!');
}

function log(message) {
  console.log(message);
}

function updateAlerts(msg) {
  alertsArea.textContent=msg;
}
