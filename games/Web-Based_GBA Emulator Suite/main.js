// Enhanced button functionality and streamlined upload process
document.addEventListener('DOMContentLoaded', () => {
  const uploadBtn = document.getElementById('uploadBtn');
  const romInput = document.getElementById('romInput');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const volumeControl = document.getElementById('volume');
  const displayScaleSelect = document.getElementById('displayScale');

  // Upload ROM with improved flow
  uploadBtn.addEventListener('click', () => {
    romInput.click();
  });

  romInput.addEventListener('change', () => {
    if (romInput.files.length > 0) {
      const file = romInput.files[0];
      // Placeholder for actual upload/processing logic
      alert('Selected file: ' + file.name);
      // Example: update status
      document.getElementById('statusText').textContent = 'ROM ready: ' + file.name;
    }
  });

  // Button controls
  startBtn.addEventListener('click', () => {
    // Implement start game logic
    alert('Game started');
    document.getElementById('statusText').textContent = 'Game running';
  });

  pauseBtn.addEventListener('click', () => {
    // Implement pause logic
    alert('Game paused');
    document.getElementById('statusText').textContent = 'Game paused';
  });

  saveBtn.addEventListener('click', () => {
    // Implement save state
    alert('State saved');
    document.getElementById('statusText').textContent = 'State saved';
  });

  loadBtn.addEventListener('click', () => {
    // Implement load state
    alert('State loaded');
    document.getElementById('statusText').textContent = 'State loaded';
  });

  // Settings modal toggle
  settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
  });

  closeSettings.addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target == settingsModal) {
      settingsModal.style.display = 'none';
    }
  });

  // Save settings with enhanced functionality
  saveSettingsBtn.addEventListener('click', () => {
    const volume = parseFloat(volumeControl.value);
    const scale = displayScaleSelect.value;
    // Apply volume (placeholder)
    // e.g., audioContext.volume.value = volume;
    // Apply display scale (placeholder)
    const canvas = document.getElementById('gameCanvas');
    const scaleNumber = parseInt(scale);
    canvas.style.transform = `scale(${scaleNumber})`;
    canvas.style.transformOrigin = 'top left';
    // Close modal
    settingsModal.style.display = 'none';
    // Log the change
    const log = document.getElementById('logMessages');
    log.innerHTML += `<div>Settings saved: Volume ${volume}, Scale ${scale}x</div>`;
  });
});