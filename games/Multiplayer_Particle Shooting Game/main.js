// Multiplayer Particle Shooting Game

// Basic setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
const player = {
    x: width / 2,
    y: height / 2,
    speed: 200,
    size: 20,
    color: 'cyan',
    facing: { x: 1, y: 0 } // default facing right
};

// Input controls
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Particles
const particles = [];
const maxParticles = 100;

function createParticle(position, velocity) {
    return {
        x: position.x,
        y: position.y,
        vx: velocity.x,
        vy: velocity.y,
        lifespan: 1.0, // in seconds
        size: 8,
        color: 'yellow',
        alpha: 1,
        trail: []
    };
}

// Shooting
let lastShotTime = 0;
const shootCooldown = 0.3; // seconds

function shoot() {
    const now = performance.now() / 1000;
    if (now - lastShotTime < shootCooldown) return;
    lastShotTime = now;

    const dir = { ...player.facing };
    const magnitude = Math.hypot(dir.x, dir.y);
    if (magnitude === 0) return;

    // Normalize direction
    dir.x /= magnitude;
    dir.y /= magnitude;

    const speed = 400; // pixels/sec
    const velocity = { x: dir.x * speed, y: dir.y * speed };

    const particle = createParticle({ x: player.x, y: player.y }, velocity);
    particles.push(particle);
    if (particles.length > maxParticles) {
        particles.shift();
    }
}

// Update functions
function update(delta) {
    // Player movement
    let moveX = 0;
    let moveY = 0;
    if (keys['w']) moveY -= 1;
    if (keys['s']) moveY += 1;
    if (keys['a']) moveX -= 1;
    if (keys['d']) moveX += 1;

    const mag = Math.hypot(moveX, moveY);
    if (mag > 0) {
        moveX /= mag;
        moveY /= mag;
        player.x += moveX * player.speed * delta;
        player.y += moveY * player.speed * delta;

        // update facing direction
        player.facing.x = moveX;
        player.facing.y = moveY;
    }

    // Boundaries
    player.x = Math.max(0, Math.min(width, player.x));
    player.y = Math.max(0, Math.min(height, player.y));

    // Update particles
    for (let p of particles) {
        // Trail for visual effect
        p.trail.push({ x: p.x, y: p.y, alpha: p.alpha });
        if (p.trail.length > 10) p.trail.shift();

        p.x += p.vx * delta;
        p.y += p.vy * delta;

        p.lifespan -= delta;
        p.alpha = Math.max(0, p.lifespan);
    }

    // Remove expired particles
    for (let i = particles.length -1; i >= 0; i--) {
        if (particles[i].lifespan <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw functions
function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw particles
    for (let p of particles) {
        for (let i = 0; i < p.trail.length; i++) {
            const trailPart = p.trail[i];
            ctx.globalAlpha = trailPart.alpha * (i / p.trail.length);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(trailPart.x, trailPart.y, p.size * (i / p.trail.length), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Main loop
let lastTime = performance.now();

function gameLoop() {
    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    update(delta);
    draw();

    requestAnimationFrame(gameLoop);
}

// Input listening for shooting
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'w') {
        shoot();
    }
});

gameLoop();