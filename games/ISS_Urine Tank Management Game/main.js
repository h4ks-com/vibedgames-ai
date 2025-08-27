let capacity = 100; // percentage
let level = 50; // current level
let isRunning = false;
let leak = false;
let overflow = false;
let systemUpgradeLevel = 1;
let language = 'en';
let miniGameActive = false;
let intervalId = null;

const levelDisplay = document.getElementById('level');
const capacityDisplay = document.getElementById('capacity');
const statusDisplay = document.getElementById('status');
const alertsDiv = document.getElementById('alerts');
const flowRange = document.getElementById('flowRate');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const repairBtn = document.getElementById('repairBtn');

// Educational tips and humorous comments
const educationalTips = [
  'Did you know? Recycling water helps sustain life in space!',
  'Humor: Even astronauts have to pee, but their tanks are fancier!'
];

// Variations of waveform signals to combine for water level simulation
const waveformVariations = [
  (t) => Math.sin(t),
  (t) => Math.cos(t),
  (t) => Math.sin(t * 0.5),
  (t) => Math.cos(t * 0.5),
  (t) => Math.sin(t) + 0.5 * Math.cos(t),
  (t) => Math.sin(t) * Math.cos(t),
  (t) => (Math.sin(t) + Math.cos(t)) / 2,
  (t) => Math.sin(t * 2),
  (t) => Math.cos(t * 2),
  (t) => Math.sin(t) + Math.cos(t)
];

// Generate combined waveform variations by mixing previous waveform with new ones
const combinedWaveforms = [];
for (let i = 0; i < waveformVariations.length; i++) {
  for (let j = 0; j < waveformVariations.length; j++) {
    combinedWaveforms.push({
      name: `Waveform ${i + 1}&${j + 1}`,
      func: (t) => (waveformVariations[i](t) + waveformVariations[j](t)) / 2
}
);
  }
}

let currentWaveformIndex = 0;

function updateDisplay() {
  levelDisplay.textContent = level.toFixed(1);
  capacityDisplay.textContent = capacity;
}

function showAlert(message) {
  alertsDiv.innerHTML = `<p>${message}</p>`;
}

function clearAlert() {
  alertsDiv.innerHTML = "";
}

function startSystem() {
  if (isRunning) return;
  isRunning = true;
  intervalId = setInterval(updateSystem, 500);
  showHumorousMessage();
}

function pauseSystem() {
  isRunning = false;
  clearInterval(intervalId);
}

function resetSystem() {
  pauseSystem();
  level = 50;
  capacity = 100;
  leak = false;
  overflow = false;
  systemUpgradeLevel = 1;
  currentWaveformIndex = 0;
  updateDisplay();
  clearAlert();
  statusDisplay.textContent = "Normal";
  showAlert('System reset! Get ready for new adventures in space maintenance.');
}

function repairLeak() {
  if (!leak) {
    showAlert('No leak detected. All clear!');
    return;
  }
  leak = false;
  showAlert('Leak repaired! Good job, space engineer!');
  setTimeout(() => { clearAlert(); }, 2000);
}

function updateSystem() {
  if (miniGameActive) return; // Pause main update during mini-game
  const flow = parseInt(flowRange.value);
  const t = Date.now() / 1000;
  // Use current waveform function
  const waveform = combinedWaveforms[currentWaveformIndex];
  const waveValue = waveform.func(t);
  // Calculate delta based on waveform
  let delta = waveValue * 0.5;
  // Adjust delta based on flow input
  delta += (flow - 50) / 100; // slight bias towards current flow
  // Leak effects
  if (leak) delta -= 0.05 * systemUpgradeLevel;
  // Random leak detection trigger
  if (Math.random() < 0.01 && !leak) {
    leak = true;
    showAlert('Uh-oh! Leak detected! Time for repair mini-game!');
    startLeakMiniGame();
  }
  // Adjust level
  level += delta * 0.05;
  // Clamp level
  if (level > 100) {
    level = 100;
    overflow = true;
  } else {
    overflow = false;
  }
  if (level < 0) level = 0;

  // Random system malfunctions for humor
  if (Math.random() < 0.005) {
    showAlert('Funny glitch! System tempers are acting weird!');
    statusDisplay.textContent = 'Glitch!';
  } else if (!overflow) {
    statusDisplay.textContent = 'Normal';
  }

  // Educational tip popup
  if (Math.random() < 0.02) {
    showEducationalTip();
  }

  // Handle overflow
  if (overflow) {
    showAlert('Overflow! Overflow! Clear the tank!');
    statusDisplay.textContent = 'Overflow!';
  }
  updateDisplay();
}

function showEducationalTip() {
  const tip = educationalTips[Math.floor(Math.random() * educationalTips.length)];
  showAlert(tip);
}

function showHumorousMessage() {
  const messages = [
    'Space Station Status: All systems look shiny!',
    'Remember: Peeing in space is fancy, but tanks need maintenance!',
    'Keep calm and fix leaks. You are the space hero!'
  ];
  showAlert(messages[Math.floor(Math.random() * messages.length)]);
}

// Leak mini-game simulation
function startLeakMiniGame() {
  miniGameActive = true;
  showAlert('Leak Repair Mini-Game: Press OK to seal the leak!');
  // Simulate mini-game success/failure
  setTimeout(() => {
    if (Math.random() < 0.8) {
      leak = false;
      showAlert('Leak sealed! Excellent work!');
    } else {
      showAlert('Oops! Failed to seal leak! System flooded!');
      // Flood effect: decrease level rapidly
      level -= 10;
      if (level < 0) level = 0;
    }
    miniGameActive = false;
    setTimeout(() => { clearAlert(); }, 2000);
  }, 2000);
}

// Event listeners
startBtn.onclick = startSystem;
pauseBtn.onclick = pauseSystem;
resetBtn.onclick = resetSystem;
repairBtn.onclick = repairLeak;

// Initialize waveform index
function changeWaveform() {
  currentWaveformIndex = (currentWaveformIndex + 1) % combinedWaveforms.length;
  showAlert('Waveform changed to ' + combinedWaveforms[currentWaveformIndex].name);
  setTimeout(() => { clearAlert(); }, 2000);
}

// Add button to change waveform variation
const controlsDiv = document.querySelector('.controls');
const changeWaveformBtn = document.createElement('button');
changeWaveformBtn.textContent = 'Change Waveform';
changeWaveformBtn.onclick = changeWaveform;
controlsDiv.appendChild(changeWaveformBtn);

// Initialization
updateDisplay();
// Optionally, set up periodic educational prompts
setInterval(showEducationalTip, 30000);