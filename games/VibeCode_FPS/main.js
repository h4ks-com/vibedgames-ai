const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Setup canvas size
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Game state
const gameState = {
    player: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        health: 100,
        ammo: 30,
        angle: 0,
        score: 0
    },
    keys: {},
    bullets: [],
    enemies: [],
    lastTime: 0
};

// Input handling
window.addEventListener('keydown', (e) => { gameState.keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { gameState.keys[e.key.toLowerCase()] = false; });

// Mouse control
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Shooting bullets
window.addEventListener('mousedown', () => {
    if (gameState.player.ammo > 0) {
        shoot();
        gameState.player.ammo -= 1;
    }
});

function shoot() {
    const dx = mouseX - gameState.player.x;
    const dy = mouseY - gameState.player.y;
    const angle = Math.atan2(dy, dx);
    gameState.bullets.push({ x: gameState.player.x, y: gameState.player.y, dx: Math.cos(angle) * 15, dy: Math.sin(angle) * 15 });
}

// Spawn enemies with varied textures
function spawnEnemy() {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const type = Math.floor(Math.random() * 3);
    const color = type === 0 ? 'darkred' : type === 1 ? 'maroon' : 'firebrick';
    gameState.enemies.push({ x, y, health: 50, color });
}

// Main game loop
function gameLoop(timestamp) {
    if (!gameState.lastTime) gameState.lastTime = timestamp;
    const delta = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;

    update(delta);
    render();
    requestAnimationFrame(gameLoop);
}

// Adjusted update function to slow down cloud movement for smoother visuals
function update(delta) {
    // Player movement
    if (gameState.keys['w']) gameState.player.y -= 0.3 * delta;
    if (gameState.keys['s']) gameState.player.y += 0.3 * delta;
    if (gameState.keys['a']) gameState.player.x -= 0.3 * delta;
    if (gameState.keys['d']) gameState.player.x += 0.3 * delta;

    // Update bullets
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const b = gameState.bullets[i];
        b.x += b.dx;
        b.y += b.dy;
        if (b.x < 0 || b.x > window.innerWidth || b.y < 0 || b.y > window.innerHeight) {
            gameState.bullets.splice(i, 1);
        }
    }

    // Enemies' logic
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        const dx = gameState.player.x - enemy.x;
        const dy = gameState.player.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
            // Reduced movement speed for smoother enemy approach
            enemy.x += (dx / dist) * 0.05 * delta; // previously 0.1
            enemy.y += (dy / dist) * 0.05 * delta;
        }
        // Check for collisions with bullets
        for (let j = gameState.bullets.length - 1; j >= 0; j--) {
            const b = gameState.bullets[j];
            if (Math.hypot(b.x - enemy.x, b.y - enemy.y) < 12) {
                enemy.health -= 25;
                gameState.bullets.splice(j, 1);
                if (enemy.health <= 0) {
                    gameState.enemies.splice(i, 1);
                    break;
                }
            }
        }
    }
}

function render() {
    ctx.fillStyle = 'linear-gradient(to right, #0f2027, #203a43, #2c5364)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player with textured look
    ctx.save();
    ctx.translate(gameState.player.x, gameState.player.y);
    ctx.fillStyle = '#ffe600';
    ctx.shadowColor = '#fff700';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw bullets with glow effect
    ctx.fillStyle = 'cyan';
    gameState.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 10;
        ctx.fill();
    });

    // Draw enemies with varied textures
    gameState.enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.fillStyle = e.color;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Draw HUD background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(15, 10, 250, 80);
    ctx.fillStyle = '#fff';
    ctx.font = '22px Verdana';
    ctx.fillText('Health: ' + Math.max(gameState.player.health, 0), 25, 40);
    ctx.fillText('Ammo: ' + gameState.player.ammo, 25, 70);
}

// Initialize enemies
for (let i = 0; i < 8; i++) {
    spawnEnemy();
}

// Start the game
requestAnimationFrame(gameLoop);