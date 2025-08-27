const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let gameRunning = false;
let score = 0;
let spawnInterval = 1500;
let lastSpawnTime = 0;
let objects = [];

const player = {
    x: 0,
    y: 0,
    radius: 20
};

function initPlayer() {
    player.x = canvas.width / 2;
    player.y = canvas.height - 30;
}

window.addEventListener('mousemove', (e) => {
    player.x = e.clientX;
    if (player.x < player.radius) player.x = player.radius;
    if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;
});

window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        player.x = e.touches[0].clientX;
        if (player.x < player.radius) player.x = player.radius;
        if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;
    }
});

function FallingObject(x, y, speed) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.speed = speed;
}

FallingObject.prototype.update = function(deltaTime) {
    this.y += this.speed * deltaTime;
};

FallingObject.prototype.draw = function() {
    ctx.fillStyle = 'tomato';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
};

function spawnObject() {
    const x = Math.random() * (canvas.width - 30);
    const speed = 100 + (level - 1) * 20;
    objects.push(new FallingObject(x, -30, speed));
}

function checkCollision(obj) {
    // Check collision with circular player (approximated as circle)
    const dx = obj.x - player.x;
    const dy = obj.y - player.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    return distance < (player.radius + obj.size / 2);
}

let lastTime = 0;
const levelThreshold = 100;
let level = 1;
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEFA');
    gradient.addColorStop(1, '#E0FFFF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    initPlayer();
    ctx.fillStyle = "#00FF00";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = objects.length -1; i >=0; i--) {
        const obj = objects[i];
        obj.update(deltaTime);
        // Check for collision
        if (checkCollision(obj)) {
            score += 10;
            objects.splice(i,1);
        } else if (obj.y > canvas.height + obj.size) {
            // Missed object
            score = Math.max(0, score - 5);
            objects.splice(i,1);
        } else {
            obj.draw();
        }
    }

    // Spawn objects
    if (performance.now() - lastSpawnTime > spawnInterval) {
        spawnObject();
        lastSpawnTime = performance.now();
    }

    // Draw score
    ctx.fillStyle = "black";
    ctx.font = "24px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    ctx.fillText("Score: " + score, 20, 30);

    // Level up
    if (score >= level * levelThreshold) {
        level += 1;
        spawnInterval = Math.max(500, spawnInterval - 200);
    }

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    } else {
        // Show game over message
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = "48px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        ctx.textAlign = 'center';
        ctx.fillText("Game Over! Press R to Restart", canvas.width / 2, canvas.height / 2);
        ctx.textAlign = 'left';
    }
}

function startGame() {
    score = 0;
    level = 1;
    spawnInterval = 1500;
    objects = [];
    gameRunning = true;
    lastSpawnTime = 0;
    initPlayer();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        startGame();
    }
});
// Initialize player
initPlayer();
startGame();
</script>
</body>
</html>