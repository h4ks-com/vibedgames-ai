// Set up canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configure canvas size
canvas.width = 800;
canvas.height = 600;

// Define Character class for the game
class Character {
  constructor(x, y, name) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.width = 50;
    this.height = 80;
    this.color = 'hsl(' + Math.random() * 360 + ', 70%, 50%)';
  }

  draw() {
    // Draw character body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // Draw head
    ctx.fillStyle = 'black';
    ctx.fillRect(this.x + 15, this.y + 20, 20, 20);
    // Draw left leg
    ctx.fillRect(this.x + 5, this.y + this.height - 10, 10, 20);
    // Draw right leg
    ctx.fillRect(this.x + this.width - 15, this.y + this.height - 10, 10, 20);
  }
}

// Define Level class with textures and backgrounds
class Level {
  constructor() {
    this.floorColor = 'rgb(120, 200, 80)';
    this.backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    this.backgroundGradient.addColorStop(0, '#87CEEB'); // Sky
    this.backgroundGradient.addColorStop(1, '#f0e68c'); // Ground
  }
  draw() {
    // Draw background gradient
    ctx.fillStyle = this.backgroundGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw textured grass floor
    const floorHeight = 100;
    ctx.fillStyle = this.floorColor;
    ctx.fillRect(0, canvas.height - floorHeight, canvas.width, floorHeight);
    // Add grass texture lines for realism
    for (let i=0; i<canvas.width; i+=20) {
      ctx.strokeStyle = 'darkgreen';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i, canvas.height - floorHeight);
      ctx.quadraticCurveTo(i + 10, canvas.height - floorHeight - 10, i + 20, canvas.height - floorHeight);
      ctx.stroke();
    }
  }
}

// Initialize level and characters
const level = new Level();
const characters = [
  new Character(100, 400, "Alice"),
  new Character(300, 400, "Bob"),
  new Character(500, 400, "Charlie")
];

// Main game loop to animate and draw
function gameLoop() {
  level.draw();
  characters.forEach(char => {
    char.draw();
  });
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();