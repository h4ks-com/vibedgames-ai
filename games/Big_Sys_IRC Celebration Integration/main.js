// Initialize game and graphics
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Load character images
const characters = {
  hero: new Image(),
  npc: new Image()
};
characters.hero.src = 'images/hero.png';
characters.npc.src = 'images/npc.png';

// Setup WebSocket for IRC celebration bot
const socket = new WebSocket('wss://your-websocket-server-address');

socket.addEventListener('open', () => {
  console.log('WebSocket connected');
});

socket.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  // Handle chat or celebration messages if needed
  if (msg.type === 'celebration') {
    // Trigger in-game notification or effects
    alert(`Celebration: ${msg.content}`);
  }
});

// Define game events
const gameEvents = {
  // Example event triggers, can be expanded
  onLevelComplete: (level) => {
    sendGameEvent('levelComplete', { level });
  },
  onHighScore: (score) => {
    sendGameEvent('highScore', { score });
  }
};

// Function to send game events to IRC bot
function sendGameEvent(eventType, data) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'gameEvent', eventType, data, timestamp: Date.now() }));
  }
}

// Example of triggering events
// gameEvents.onLevelComplete(1);
// gameEvents.onHighScore(15000);

// Example game loop with minimal drawing
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw background with texture or color
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw characters
  ctx.drawImage(characters.hero, 50, 50, 50, 50);
  ctx.drawImage(characters.npc, 200, 50, 50, 50);
  requestAnimationFrame(gameLoop);
}

// Wait for images to load before starting
window.onload = () => {
  gameLoop();
};