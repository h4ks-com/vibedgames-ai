// main.js - Improved Explosion Animation Script
// This script handles the full-screen, realistic explosion effects

const canvas = document.getElementById("explosionCanvas");
const ctx = canvas.getContext("2d");
let devicePixelRatio = window.devicePixelRatio || 1;

// Resize canvas to fit window and handle high-DPI screens
function resizeCanvas() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.scale(devicePixelRatio, devicePixelRatio);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Particle class for debris, smoke, flames
class Particle {
    constructor(x, y, colorScheme) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.color = colorScheme[Math.floor(Math.random() * colorScheme.length)];
        const angle = Math.random() * 2 * Math.PI;
        const speed = Math.random() * 10 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.life = Math.random() * 50 + 50;
        this.age = 0;
    }
    update() {
        this.x += this.vx * 0.016;
        this.y += this.vy * 0.016;
        this.alpha -= 1 / this.life;
        this.age++;
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Explosion class managing particles
class Explosion {
    constructor(x, y, colorScheme) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.isFinished = false;
        this.generateParticles(colorScheme);
    }
    generateParticles(colorScheme) {
        const particleCount = Math.floor(Math.random() * 100) + 50;
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(this.x, this.y, colorScheme));
        }
    }
    update() {
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.alpha > 0 && p.age < p.life);
        if (this.particles.length === 0) {
            this.isFinished = true;
        }
    }
    draw() {
        this.particles.forEach(p => p.draw());
    }
}

const explosions = [];

// Function to create explosion at random position
function createExplosion() {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const colorScheme = ["#ff7f00", "#ffbf00", "#ffff00", "#ffffff", "#ff0000", "#ffa500"];
    explosions.push(new Explosion(x, y, colorScheme));
}

// Animation loop
function animate() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    explosions.forEach(explosion => {
        explosion.update();
        explosion.draw();
    });
    // Remove finished explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        if (explosions[i].isFinished) {
            explosions.splice(i, 1);
        }
    }
    requestAnimationFrame(animate);
}

// Initialize: create several explosions at load
function initExplosions() {
    const explosionCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < explosionCount; i++) {
        createExplosion();
    }
}

// Start animation on window load
window.onload = () => {
    initExplosions();
    animate();
};
