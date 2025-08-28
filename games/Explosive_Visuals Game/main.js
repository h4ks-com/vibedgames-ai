// Improved main.js based on project task list
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to full window size
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Initialize scene elements
const explosions = [];
const characters = [];
const maxCharacters = 10;

// Create characters with detailed appearance
for (let i = 0; i < maxCharacters; i++) {
    characters.push({
        x: Math.random() * (window.innerWidth - 50),
        y: Math.random() * (window.innerHeight - 80),
        width: 40,
        height: 60,
        color: `hsl(${(i * 70) % 360}, 70%, 50%)`,
        draw: function() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            // Head
            ctx.fillStyle = '#ffe0b2';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/4, this.width/4, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x + this.width/3, this.y + this.height/4, 2, 0, Math.PI * 2);
            ctx.arc(this.x + 2*this.width/3, this.y + this.height/4, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// Player object with improved appearance
const player = {
    x: 50,
    y: 50,
    width: 40,
    height: 60,
    color: '#3498db',
    draw: function() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Face
        ctx.fillStyle = '#ffe0b2';
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/3, this.width/4, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.width/3, this.y + this.height/3, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 2*this.width/3, this.y + this.height/3, 3, 0, Math.PI * 2);
        ctx.fill();
    }
};

// Keyboard controls
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Create explosion at position
function createExplosion(x, y) {
    explosions.push({ x, y, radius: 1, maxRadius: 80 + Math.random() * 40, alpha: 1, stage: 'initial' });
}

// Animate explosion effects
function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const e = explosions[i];
        if (e.stage === 'initial') {
            e.radius += 3;
            e.alpha -= 0.02;
            if (e.radius >= e.maxRadius / 2) {
                e.stage = 'shockwave';
            }
        } else if (e.stage === 'shockwave') {
            e.radius += 2;
            e.alpha -= 0.015;
            if (e.radius >= e.maxRadius) {
                e.stage = 'smoke';
            }
        } else if (e.stage === 'smoke') {
            e.radius += 0.5;
            e.alpha -= 0.01;
            if (e.alpha <= 0) {
                explosions.splice(i, 1);
            }
        }
    }
}

// Generate debris particles for realism
function generateDebris(x, y) {
    const debrisCount = 20 + Math.floor(Math.random() * 30);
    const debrisList = [];
    for (let i = 0; i < debrisCount; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 5 + 2;
        debrisList.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2 + Math.random() * 2,
            life: 0.5 + Math.random() * 0.5
        });
    }
    return debrisList;
}

// Handle debris particles
let debrisParticles = [];

// Update debris particles
function updateDebris() {
    for (let i = debrisParticles.length - 1; i >= 0; i--) {
        const p = debrisParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.life -= 0.01;
        if (p.life <= 0) {
            debrisParticles.splice(i, 1);
        }
    }
}

// Draw debris particles
function drawDebris() {
    debrisParticles.forEach(p => {
        ctx.fillStyle = `rgba(200, 200, 200, ${p.life * 2})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
}

// Main update function
function update() {
    // Player movement
    if (keys['ArrowUp']) player.y -= 2;
    if (keys['ArrowDown']) player.y += 2;
    if (keys['ArrowLeft']) player.x -= 2;
    if (keys['ArrowRight']) player.x += 2;
    // Boundaries
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

    // Update explosions
    updateExplosions();

    // Generate debris during explosion stages
    explosions.forEach(e => {
        if (e.stage === 'shockwave' && e.radius === Math.floor(e.maxRadius / 2)) {
            debrisParticles.push(...generateDebris(e.x, e.y));
        }
    });

    // Update debris
    updateDebris();
}

// Draw all elements
function draw() {
    // Background gradient for texture
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0d1b2a');
    gradient.addColorStop(1, '#1b263b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw characters
    characters.forEach(c => c.draw());

    // Draw player
    player.draw();

    // Draw explosions
    explosions.forEach(e => {
        ctx.globalAlpha = e.alpha;
        ctx.strokeStyle = 'orange';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    });

    // Draw debris particles
    drawDebris();
}

// Main game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Trigger explosion on spacebar
window.addEventListener('keydown', e => {
    if (e.key === ' ') {
        createExplosion(player.x + player.width/2, player.y + player.height/2);
        // Generate debris for visual realism
        debrisParticles.push(...generateDebris(player.x + player.width/2, player.y + player.height/2));
    }
});

// Optional: trigger explosions at intervals for continuous effects
setInterval(() => {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    createExplosion(x, y);
    debrisParticles.push(...generateDebris(x, y));
}, 3000);

// Start game
gameLoop();