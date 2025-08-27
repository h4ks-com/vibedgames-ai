const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBoard = document.getElementById('scoreBoard');
const gameOverDiv = document.getElementById('gameOver');

// Game settings
const width = 800;
const height= 600;
let score = 0;
const targetScore = 50;
let gameActive= true;

// Player properties
const player = {
    x: width/2 - 25,
    y: height - 50,
    width: 50,
    height: 20,
    speed: 7,
    dx: 0
};

// Falling objects
let objects = [];
let spawnInterval = 30; // frames
let frameCount = 0;

// Resize canvas
canvas.width = width;
canvas.height= height;

// Handle controls
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

function spawnObject() {
    const size = 20;
    const x = Math.random() * (width - size);
    objects.push({x: x, y: -size, size: size, speed: 3 + Math.random() * 2});
}

function update() {
    if(!gameActive) return;
    ctx.clearRect(0, 0, width, height);
    // Player movement
    if(keys['ArrowLeft']) player.x -= player.speed;
    if(keys['ArrowRight']) player.x += player.speed;
    // Boundary check
    if(player.x <0) player.x=0;
    if(player.x + player.width > width) player.x= width - player.width;

    // Draw player with gradient
    const gradient = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
    gradient.addColorStop(0, '#0a84ff');
    gradient.addColorStop(1, '#1c1c1c');
    ctx.fillStyle= gradient;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Spawn objects
    frameCount++;
    if(frameCount % spawnInterval ===0 && score < targetScore) {
        spawnObject();
    }
    // Update objects
    for(let i= objects.length -1;i>=0; i--) {
        objects[i].y += objects[i].speed;
        // Draw object with gradient
        const objGradient = ctx.createRadialGradient(objects[i].x, objects[i].y, 0, objects[i].x, objects[i].y, objects[i].size/2);
        objGradient.addColorStop(0, '#ff6347');
        objGradient.addColorStop(1, '#8b0000');
        ctx.fillStyle= objGradient;
        ctx.beginPath();
        ctx.arc(objects[i].x, objects[i].y, objects[i].size/2, 0, Math.PI*2);
        ctx.fill();
        // Collision detection
        if (objects[i].y + objects[i].size/2 >= player.y &&
            objects[i].x > player.x &&
            objects[i].x < player.x + player.width) {
            // Collected
            objects.splice(i, 1);
            score++;
            scoreBoard.textContent= 'Score: ' + score;
            if(score >= targetScore) {
                endGame();
            }
        } else if(objects[i].y > height) {
            // Remove off-screen
            objects.splice(i,1);
        }
    }
    requestAnimationFrame(update);
}

function endGame() {
    gameActive = false;
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,width,height);
    ctx.font='45px "Trebuchet MS", Helvetica, sans-serif';
    ctx.fillStyle='gold';
    ctx.textAlign='center';
    ctx.fillText('Congratulations! You collected 50 objects!', width/2, height/2);
}

// Start game loop
update();