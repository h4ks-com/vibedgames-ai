'use strict';
// Main Game Module for VibeQuest: Cyber Noir

// Scene management
const scenes = {
    current: 'street',
    changeTo(scene) {
        this.current = scene;
        console.log(`Scene changed to: ${scene}`);
        // TODO: Load scene assets and initialize
    },
    loadScene(sceneName) {
        // Placeholder for scene loading logic
    }
};

// Atmosphere and vibe mechanics
const vibe = {
    moodLevel: 50, // Range 0-100
    changeMood(amount) {
        this.moodLevel = Math.max(0, Math.min(100, this.moodLevel + amount));
        updateVibeVisuals();
    },
    get vibeEffects() {
        // Return effects based on moodLevel
        if (this.moodLevel > 75) return 'vibrant';
        if (this.moodLevel < 25) return 'dull';
        return 'neon';
    }
};

// Player and exploration state
const playerState = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    speed: 5,
    inventory: [],
    // TODO: Add stats, cybernetic upgrades
};

// Basic AI-driven character (NPC)
const npc = {
    name: 'Fixer',
    x: 300,
    y: 400,
    interact() {
        // Placeholder for dialogue
        console.log('Interacting with NPC:', this.name);
        triggerDialogue(`${this.name} says: "Need a fix?"`);
    }
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Load assets
const assets = {
    playerSprite: new Image(),
    backgroundTexture: new Image(),
    // Future: UI overlays, icons
};
assets.playerSprite.src = 'https://images.unsplash.com/photo-1549887534-7c6808420d73?ixlib=rb-4.0.4&auto=format&fit=crop&w=800&q=80';
assets.backgroundTexture.src = 'https://images.unsplash.com/photo-1517511620798-cec17d428bc0?ixlib=rb-4.0.4&auto=format&fit=crop&w=1600&q=80';

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Draw background with atmosphere effects
function drawBackground() {
    const pattern = ctx.createPattern(assets.backgroundTexture, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Visual vibe overlays based on vibe.vibeEffects
    if (vibe.vibeEffects === 'dull') {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (vibe.vibeEffects === 'vibrant') {
        // Add neon glow effect overlay
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 20;
    }
}
// Draw player sprite
function drawPlayer() {
    ctx.drawImage(assets.playerSprite, playerState.x - 32, playerState.y - 32, 64, 64);
}
// Draw NPC
function drawNPC() {
    ctx.fillStyle = '#0ff'; // neon color for characters
    ctx.font = '20px Orbitron';
    ctx.fillText(npc.name, npc.x, npc.y);
}
// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    // Movement
    if (keys['ArrowUp']) playerState.y -= playerState.speed;
    if (keys['ArrowDown']) playerState.y += playerState.speed;
    if (keys['ArrowLeft']) playerState.x -= playerState.speed;
    if (keys['ArrowRight']) playerState.x += playerState.speed;
    // Bounds
    playerState.x = Math.max(0, Math.min(canvas.width - 64, playerState.x));
    playerState.y = Math.max(0, Math.min(canvas.height - 64, playerState.y));
    // Draw entities
    drawPlayer();
    drawNPC();
    // TODO: Update vibe based on environment or interactions
    requestAnimationFrame(gameLoop);
}
// Dialogue system placeholder
function triggerDialogue(text) {
    // Future: UI overlay for dialogue
    console.log('Dialogue:', text);
}
// Vibe visual updates
function updateVibeVisuals() {
    // Implement visual mood indicators, neon overlays, etc.
}
// Initialize
assets.playerSprite.onload = () => { gameLoop(); };
assets.backgroundTexture.onload = () => { /* Ready to draw background */ };