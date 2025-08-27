// js/app.js

// =================== DOM Elements ===================
const powerBtn = document.getElementById('powerBtn');
const resetBtn = document.getElementById('resetBtn');
const loadROMBtn = document.getElementById('loadRomBtn');
const romInput = document.getElementById('romFileInput');
const canvas = document.getElementById('gbaScreen');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('statusText');
const fpsDisplay = document.getElementById('fpsDisplay');
const volumeRange = document.getElementById('volumeSlider');
const scaleSelect = document.getElementById('scaleSelect');
const controls = {
  up: document.getElementById('dpadUp'),
  down: document.getElementById('dpadDown'),
  left: document.getElementById('dpadLeft'),
  right: document.getElementById('dpadRight'),
  a: document.getElementById('buttonA'),
  b: document.getElementById('buttonB'),
  l: document.getElementById('buttonL'),
  r: document.getElementById('buttonR'),
  start: document.getElementById('buttonStart'),
  select: document.getElementById('buttonSelect')
};

// =================== Emulator State Variables ===================
let emulator = null; // Placeholder for the emulator core instance
let isRunning = false;
let lastFrameTime = 0;
let fps = 0;
const fpsHistory = [];

// =================== Power Toggle ===================
const powerToggleBtn = document.getElementById('powerToggle');
const powerIndicator = document.getElementById('powerIndicator');

powerToggleBtn.onclick = () => {
  togglePower();
};

function togglePower() {
  if (!emulator) {
    updateStatus('No ROM loaded');
    return;
  }
  // Switch power state
  if (emulator.isPowered) {
    emulator.isPowered = false;
    isRunning = false;
    updateStatus('Powered OFF');
  } else {
    emulator.isPowered = true;
    startEmulator();
    updateStatus('Powered ON & Running');
  }
  updatePowerIndicator();
}

function updatePowerIndicator() {
  if (emulator && emulator.isPowered) {
    powerIndicator.classList.add('on');
  } else {
    powerIndicator.classList.remove('on');
  }
}

// =================== Load ROM ===================
const loadRomBtn = document.getElementById('loadRomBtn');
const romFileInput = document.getElementById('romFileInput');
loadRomBtn.onclick = () => {
  romFileInput.click();
};

romFileInput.onchange = () => {
  const file = romFileInput.files[0];
  if (file) {
    loadROM(file);
  }
};

function loadROM(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const arrayBuffer = reader.result;
    initializeEmulator(arrayBuffer);
    updateStatus(`Loaded ROM: ${file.name}`);
  };
  reader.readAsArrayBuffer(file);
}

// =================== Emulator Initialization ===================
function initializeEmulator(romBuffer) {
  // Placeholder: instantiate your emulator core with ROM data
  emulator = {
    isPowered: true,
    romData: new Uint8Array(romBuffer),
    reset: function() { /* Reset emulator core state here */ },
    // Additional core initialization
  };
  // Start the emulation
  startEmulator();
}

// =================== Start Emulator Loop ===================
function startEmulator() {
  if (!emulator || !emulator.isPowered) return;
  isRunning = true;
  updateStatus('Emulation Started');
  requestAnimationFrame(emulationLoop);
}

// =================== Power Control ===================
// (handled with togglePower above)

// =================== Reset Functionality ===================
const resetBtn = document.getElementById('resetBtn');
resetBtn.onclick = () => {
  resetEmulator();
};

function resetEmulator() {
  if (emulator) {
    emulator.reset();
    updateStatus('Emulator Reset');
  } else {
    updateStatus('No ROM loaded');
  }
}

// =================== Main Emulation Loop ===================
function emulationLoop(timestamp) {
  if (!isRunning || !emulator || !emulator.isPowered) {
    requestAnimationFrame(emulationLoop);
    return;
  }
  // Placeholder: perform CPU, GPU, Audio updates here
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Placeholder for rendering emulator frame - replace with real rendering
  // e.g., draw emulator framebuffer to canvas

  // Calculate FPS
  fpsHistory.push(timestamp);
  while (fpsHistory.length > 60) fpsHistory.shift();
  if (fpsHistory.length > 1) {
    const delta = fpsHistory[fpsHistory.length - 1] - fpsHistory[0];
    fps = Math.round((fpsHistory.length - 1) * 1000 / delta);
    fpsDisplay.textContent = `FPS: ${fps}`;
  }
  requestAnimationFrame(emulationLoop);
}

// =================== Input Handling ===================
// Map emulator input state (e.g., keypad register) here
const inputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  a: false,
  b: false,
  l: false,
  r: false,
  start: false,
  select: false
};

// Helper function to set input state
function setInput(button, pressed) {
  inputState[button] = pressed;
  // Send input state to emulator core here
  // e.g., emulator.setButtonState(button, pressed);
}

// Add event listeners to control buttons
Object.keys(controls).forEach(key => {
  const btn = controls[key];
  btn.onmousedown = () => setInput(key, true);
  btn.onmouseup = () => setInput(key, false);
  btn.ontouchstart = () => setInput(key, true);
  btn.ontouchend = () => setInput(key, false);
});

// Optional: Keyboard fallback for testing
window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': setInput('up', true); break;
    case 'ArrowDown': setInput('down', true); break;
    case 'ArrowLeft': setInput('left', true); break;
    case 'ArrowRight': setInput('right', true); break;
    case 'a': case 'A': setInput('a', true); break;
    case 'b': case 'B': setInput('b', true); break;
    case 'l': case 'L': setInput('l', true); break;
    case 'r': case 'R': setInput('r', true); break;
    case 'Enter': setInput('start', true); break;
    case 'Shift': setInput('select', true); break;
  }
});
window.addEventListener('keyup', (e) => {
  switch (e.key) {
    case 'ArrowUp': setInput('up', false); break;
    case 'ArrowDown': setInput('down', false); break;
    case 'ArrowLeft': setInput('left', false); break;
    case 'ArrowRight': setInput('right', false); break;
    case 'a': case 'A': setInput('a', false); break;
    case 'b': case 'B': setInput('b', false); break;
    case 'l': case 'L': setInput('l', false); break;
    case 'r': case 'R': setInput('r', false); break;
    case 'Enter': setInput('start', false); break;
    case 'Shift': setInput('select', false); break;
  }
});

// =================== Responsive display scaling ===================
scaleSelect.onchange = () => {
  const scale = parseInt(scaleSelect.value, 10);
  ctx.canvas.style.transform = `scale(${scale})`;
};

// =================== Volume control ===================
volumeRange.oninput = () => {
  const volume = parseFloat(volumeRange.value);
  // Apply volume to emulator audio system
  // e.g., emulator.setVolume(volume);
  updateStatus(`Volume: ${volume}`);
};

// =================== Utility functions ===================
function updateStatus(msg) {
  statusText.textContent = `Status: ${msg}`;
}

// Initialize power indicator
updatePowerIndicator();
