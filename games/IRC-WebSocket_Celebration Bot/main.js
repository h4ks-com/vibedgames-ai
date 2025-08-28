// main.js
// Initialize canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size to window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Character class with detailed appearance
class Character {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 80;
        this.color = color;
        this.armColor = '#333';
        this.faceColor = '#ffd700'; // skin tone
        this.features = {
            eyes: [{dx: 10, dy: 20, radius: 3}, {dx: 30, dy: 20, radius: 3}],
            mouth: {dx: 20, dy: 35, radius: 4}
        };
    }

    draw() {
        // Draw body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
        // Draw head
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y - this.height - 20, 20, 0, Math.PI * 2);
        ctx.fillStyle = this.faceColor;
        ctx.fill();
        // Draw eyes
        ctx.fillStyle = 'black';
        this.features.eyes.forEach(eye => {
            ctx.beginPath();
            ctx.arc(this.x + eye.dx, this.y - this.height - 20 + eye.dy, eye.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        // Draw mouth
        ctx.beginPath();
        ctx.arc(this.x + this.features.mouth.dx, this.y - this.height - 20 + this.features.mouth.dy, this.features.mouth.radius, 0, Math.PI);
        ctx.strokeStyle = 'red';
        ctx.stroke();
        // Draw arms
        ctx.strokeStyle = this.armColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2);
        ctx.lineTo(this.x - 20, this.y - this.height / 2 - 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y - this.height / 2);
        ctx.lineTo(this.x + this.width + 20, this.y - this.height / 2 - 20);
        ctx.stroke();
    }
}

// Create characters
let characters = [];
for (let i = 0; i < 5; i++) {
    const x = 100 + i * 120;
    const y = window.innerHeight - 50;
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF5'];
    characters.push(new Character(x, y, colors[i % colors.length]));
}

// Variables for celebration state
let celebrating = false;
let celebrationStartTime = 0;
const celebrationDuration = 3000; // 3 seconds

// Main animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw textured background
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#88cc88');
    gradient.addColorStop(1, '#ffffff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw characters
    characters.forEach(char => {
        char.draw();
    });

    // If celebrating, add celebration visuals
    if (celebrating) {
        const elapsed = Date.now() - celebrationStartTime;
        if (elapsed > celebrationDuration) {
          celebrating = false;
        } else {
          drawCelebrationEffects();
        }
    }

    requestAnimationFrame(animate);
}

// Placeholder for celebration effects
function drawCelebrationEffects() {
    // Example: draw falling confetti or balloons (simple circles here)
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = `rgba(255, ${Math.floor(Math.random() * 255)}, 0, 0.5)`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

animate();

// --- IRC and WebSocket integration ---
const ircServer = 'irc.h4ks.com';
const ircPort = 8097;
const channel = '#lobby';
const nickname = 'CelebrationBot';
const websocketUrl = 'ws://example.com/celebration'; // Replace with actual WebSocket URL

// WebSocket connection
let ws = null;
function connectWebSocket() {
  ws = new WebSocket(websocketUrl);
  ws.onopen = () => {
    console.log('WebSocket connected');
  };
  ws.onclose = () => {
    console.log('WebSocket disconnected, retrying...');
    setTimeout(connectWebSocket, 3000);
  };
  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };
}
connectWebSocket();

// IRC connection (assuming a WebSocket IRC bridge or replace with native TCP if possible)
function connectIRC() {
  const ircSocket = new WebSocket(`ws://${ircServer}:${ircPort}`); // This may need to be a raw TCP socket; WebSocket used here as placeholder
  ircSocket.onopen = () => {
    console.log('IRC connection established');
    ircSocket.send('NICK ' + nickname + '\r\n');
    ircSocket.send('USER ' + nickname + ' 0 * :' + nickname + '\r\n');
    ircSocket.send('JOIN ' + channel + '\r\n');
  };
  ircSocket.onmessage = (event) => {
    const message = event.data;
    console.log('IRC message:', message);
    if (message.startsWith('PING')) {
      ircSocket.send('PONG ' + message.slice(5) + '\r\n');
    }
    // Detect command '!launch' in channel
    if (message.includes('!launch')) {
      triggerCelebration();
    }
  };
  ircSocket.onerror = (err) => {
    console.error('IRC socket error:', err);
  };
  ircSocket.onclose = () => {
    console.log('IRC connection closed, reconnecting...');
    setTimeout(connectIRC, 3000);
  };
}

// Start IRC connection
let ircConn = null;
function startIRC() {
  ircConn = connectIRC();
}
startIRC();

// Trigger celebration: show visuals and send WebSocket message
function triggerCelebration() {
  // Set celebration state for animation
  celebrating = true;
  celebrationStartTime = Date.now();
  // Send message via WebSocket
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      text: '🎉🚀🍾 Product launched! 🎉🚀🍾',
      timestamp: new Date().toISOString()
    }));
    console.log('Celebration message sent');
  } else {
    console.warn('WebSocket not connected');
  }
}

// Optional: add UI button or other triggers for manual celebration
// For now, trigger celebration automatically upon receiving '!launch' command
