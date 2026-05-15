// Genocide of Italian Brainrot - Enhanced Game Logic

class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    createExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 12;
        this.vy = (Math.random() - 0.5) * 12;
        this.color = color;
        this.life = 1.0;
        this.decay = 0.02;
        this.size = Math.random() * 4 + 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.rotation += this.rotationSpeed;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw star-shaped particle
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const radius = i % 2 === 0 ? this.size : this.size / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

class CreatureFactory {
    static createCreature() {
        const types = [
            { name: "Tortellini Terror", color: "#ff6b6b", size: 30, speed: 2, points: 10 },
            { name: "Lasagna Lord", color: "#4ecdc4", size: 40, speed: 1.5, points: 15 },
            { name: "Pizza Monster", color: "#ffe66d", size: 35, speed: 2.5, points: 20 },
            { name: "Gelatinous Blob", color: "#a8e6cf", size: 25, speed: 3, points: 25 },
            { name: "Carbonara Beast", color: "#ff8b94", size: 45, speed: 1, points: 30 },
            { name: "Risotto Reaper", color: "#ff6b9d", size: 35, speed: 2, points: 35 },
            { name: "Cannoli Crusher", color: "#c44569", size: 30, speed: 2.5, points: 40 },
            { name: "Bolognai Berserker", color: "#f8b500", size: 40, speed: 1.8, points: 45 }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            type: type,
            vx: (Math.random() - 0.5) * type.speed,
            vy: (Math.random() - 0.5) * type.speed,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            alive: true,
            slopLevel: Math.random() * 0.5 + 0.5,
            health: Math.floor(type.points / 5),
            maxHealth: Math.floor(type.points / 5)
        };
    }
    
    static drawCreature(ctx, creature) {
        if (!creature.alive) return;
        
        ctx.save();
        ctx.translate(creature.x, creature.y);
        ctx.rotate(creature.rotation);
        
        // Draw AI slop creature with enhanced effects
        ctx.fillStyle = creature.type.color;
        ctx.globalAlpha = creature.slopLevel;
        
        // Create more distorted AI-slop shape
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const radius = creature.type.size + Math.sin(angle * 5) * 15 * creature.slopLevel;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Add AI glitch effects
        for (let i = 0; i < 8; i++) {
            const noiseX = (Math.random() - 0.5) * creature.type.size;
            const noiseY = (Math.random() - 0.5) * creature.type.size;
            const noiseSize = Math.random() * 8;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.4})`;
            ctx.fillRect(noiseX, noiseY, noiseSize, noiseSize);
        }
        
        // Draw health bar
        if (creature.health < creature.maxHealth) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-20, -creature.type.size - 15, 40, 4);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-20, -creature.type.size - 15, 40 * (creature.health / creature.maxHealth), 4);
        }
        
        ctx.restore();
        
        // Draw creature name with Italian flag
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(creature.type.name, creature.x, creature.y - creature.type.size - 10);
    }
    
    static updateCreature(creature) {
        if (!creature.alive) return;
        
        creature.x += creature.vx;
        creature.y += creature.vy;
        creature.rotation += creature.rotationSpeed;
        
        // Bounce off walls
        if (creature.x <= creature.type.size || creature.x >= canvas.width - creature.type.size) {
            creature.vx = -creature.vx;
        }
        if (creature.y <= creature.type.size || creature.y >= canvas.height - creature.type.size) {
            creature.vy = -creature.vy;
        }
        
        // Keep in bounds
        creature.x = Math.max(creature.type.size, Math.min(canvas.width - creature.type.size, creature.x));
        creature.y = Math.max(creature.type.size, Math.min(canvas.height - creature.type.size, creature.y));
    }
    
    static hitCreature(creature) {
        creature.health--;
        if (creature.health <= 0) {
            creature.alive = false;
            return true; // Creature died
        }
        return false; // Creature still alive
    }
}

// Enhanced game initialization
function initGame() {
    score = 0;
    gameRunning = true;
    particles = [];
    bullets = [];
    creatures = [];
    particleSystem = new ParticleSystem();
    
    // Spawn initial creatures
    for (let i = 0; i < 15; i++) {
        creatures.push(CreatureFactory.createCreature());
    }
    
    // Spawn timer for continuous waves
    spawnTimer = setInterval(() => {
        if (gameRunning && creatures.filter(c => c.alive).length < 5) {
            creatures.push(CreatureFactory.createCreature());
        }
    }, 3000);
}

// Enhanced game loop
function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas with trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw creatures
    creatures.forEach(creature => {
        CreatureFactory.updateCreature(creature);
        CreatureFactory.drawCreature(ctx, creature);
    });
    
    // Update and draw bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.update();
        bullet.draw();
        
        // Check collision with creatures
        creatures.forEach(creature => {
            if (creature.alive) {
                const dx = bullet.x - creature.x;
                const dy = bullet.y - creature.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < creature.type.size) {
                    if (CreatureFactory.hitCreature(creature)) {
                        // Creature died
                        score += creature.type.points;
                        scoreElement.textContent = `Score: ${score}`;
                        particleSystem.createExplosion(creature.x, creature.y, creature.type.color);
                        
                        // Check win condition
                        const aliveCreatures = creatures.filter(c => c.alive);
                        if (aliveCreatures.length === 0) {
                            endGame();
                        }
                    }
                    bullets.splice(i, 1);
                    break;
                }
            }
        });
        
        // Remove dead bullets
        if (bullet.life <= 0) {
            bullets.splice(i, 1);
        }
    }
    
    // Update and draw particles
    particleSystem.update();
    particleSystem.draw(ctx);
    
    // Draw enhanced crosshair
    drawCrosshair();
    
    requestAnimationFrame(gameLoop);
}

function drawCrosshair() {
    ctx.strokeStyle = "#ff0066";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 15, 0, Math.PI * 2);
    ctx.moveTo(mouseX - 20, mouseY);
    ctx.lineTo(mouseX + 20, mouseY);
    ctx.moveTo(mouseX, mouseY - 20);
    ctx.lineTo(mouseX, mouseY + 20);
    ctx.stroke();
}

// Rest of the game functions remain the same...
// (scoreElement, finalScoreElement, restartButton, mouse events, etc.)