const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
});

// Player object
let player = {
  x: width / 2,
  y: height / 2,
  radius: 10,
  color: 'blue',
  speed: 4,
  score: 0
};

// Food array
const foods = [];
const FOOD_COUNT = 50;

// Generate initial food
for(let i=0; i<FOOD_COUNT; i++) {
  foods.push({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 4,
    color: 'green'
  });
}

// Mouse position
const mouse = {
  x: 0,
  y: 0
};

document.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

// Movement towards mouse
function updatePlayer() {
  const dx = mouse.x - player.x;
  const dy = mouse.y - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 1) {
    player.x += (dx / dist) * player.speed;
    player.y += (dy / dist) * player.speed;
  }
}

// Draw functions
function drawCircle(obj) {
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
  ctx.fillStyle = obj.color;
  ctx.fill();
}

// Check collision with food
function checkFoodCollision() {
  for (let i=foods.length-1; i>=0; i--) {
    const food = foods[i];
    const dx = food.x - player.x;
    const dy = food.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.radius + food.radius) {
      // eat food
      foods.splice(i, 1);
      player.score += 1;
      player.radius += 0.2; // grow
      player.speed = Math.max(2, 4 - player.radius * 0.05); // slow down as grow
      scoreDisplay.textContent = 'Score: ' + player.score;
      // spawn new food
      foods.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 4,
        color: 'green'
      });
    }
  }
}

// Animate loop
function gameLoop() {
  ctx.clearRect(0, 0, width, height);
  updatePlayer();
  // Draw food
  for (const food of foods) {
    drawCircle(food);
  }
  // Draw player
  drawCircle(player);
  checkFoodCollision();
  requestAnimationFrame(gameLoop);
}

// Restart button
restartBtn.addEventListener('click', () => {
  player.x = width / 2;
  player.y = height / 2;
  player.radius = 10;
  player.score = 0;
  scoreDisplay.textContent = 'Score: 0';
});

// Start game
gameLoop();

// Optional: simple multiplayer sync via WebSocket (not fully implemented here)
// This is a placeholder for future implementation.
// const socket = new WebSocket('ws://yourserver');
// socket.onmessage = (e) => {
//   const data = JSON.parse(e.data);
//   // handle updates
// };
// function sendUpdate() {
//   socket.send(JSON.stringify({x: player.x, y: player.y, radius: player.radius}));
// }
// setInterval(sendUpdate, 50);