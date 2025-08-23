const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiTurnInfo = document.getElementById('turnInfo');
const nextTurnBtn = document.getElementById('nextTurn');
const statusDiv = document.getElementById('status');

// Game variables
let terrain = [];
const terrainWidth = 800;
const terrainHeight = 300;
const numWorms = 4;
const worms = [];
let activeWormIndex = 0;
let projectiles = [];
let gameState = 'playing';
let gravity = 0.3;
let turnTimer = 0;
const maxTurnTime = 30; // seconds

// Initialize game
function init() {
    canvas.width = terrainWidth;
    canvas.height = 400;
    generateTerrain();
    placeWorms();
    setupControls();
    gameLoop();
}

function generateTerrain() {
    // Simple random terrain
    terrain = [];
    let height = 200;
    for(let x=0; x<terrainWidth; x++) {
        height += (Math.random() - 0.5) * 10;
        if(height > 330) height = 330;
        if(height < 100) height = 100;
        terrain.push(height);
    }
}

function placeWorms() {
    for(let i=0; i<numWorms; i++) {
        let x = (i+1) * (terrainWidth / (numWorms+1));
        let y = terrain[Math.floor(x)];
        worms.push({
            id: i,
            x: x,
            y: y - 20,
            health: 100,
            width: 20,
            height: 20,
            color: ['red','blue','green','yellow'][i],
            alive: true
        });
    }
}

function setupControls() {
    document.addEventListener('keydown', handleKeyDown);
    nextTurnBtn.addEventListener('click', endTurn);
}

function handleKeyDown(e) {
    if(gameState !== 'playing') return;
    const worm = worms[activeWormIndex];
    if(!worm || !worm.alive) return;
    switch(e.code) {
        case 'ArrowLeft':
            worm.x -= 5;
            if(worm.x < 0) worm.x=0;
            worm.y = terrain[Math.floor(worm.x)];
            break;
        case 'ArrowRight':
            worm.x +=5;
            if(worm.x > terrainWidth) worm.x=terrainWidth;
            worm.y = terrain[Math.floor(worm.x)];
            break;
        case 'Space':
            shoot();
            break;
    }
}

function shoot() {
    const worm = worms[activeWormIndex];
    // Simple projectile
    const angle = Math.PI/4; // 45 degrees for simplicity
    const power = 10; // fixed power for now
    const vx = Math.cos(angle) * power;
    const vy = -Math.sin(angle) * power;
    projectiles.push({
        x: worm.x,
        y: worm.y,
        vx: vx,
        vy: vy,
        owner: activeWormIndex
    });
}

function endTurn() {
    // Switch to next alive worm
    do {
        activeWormIndex = (activeWormIndex + 1) % worms.length;
    } while(!worms[activeWormIndex].alive);
    updateTurnInfo();
}

function updateTurnInfo() {
    uiTurnInfo.innerText = 'Turn: Player ' + (worms[activeWormIndex].id +1);
}

function gameLoop() {
    update();
    draw();
    if(gameState==='playing') {
        requestAnimationFrame(gameLoop);
    }
}

function update() {
    // Update projectiles
    for(let p of projectiles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        // Check collision with terrain
        if(p.x<0 || p.x>=terrainWidth || p.y>=canvas.height) {
            // Remove projectile
            p.hit = true;
            continue;
        }
        if(p.y >= terrain[Math.floor(p.x)]) {
            p.hit = true;
            explode(p.x, p.y);
            // Damage worms if hit
            for(let worm of worms) {
                if(worm.alive && Math.abs(worm.x - p.x) < worm.width && Math.abs(worm.y - p.y) < worm.height) {
                    worm.health -= 50;
                    if(worm.health <=0) {
                        worm.alive = false;
                        // Check for game over
                        checkGameOver();
                    }
                }
            }
        }
    }
    projectiles = projectiles.filter(p=>!p.hit);
}

function explode(x,y) {
    // Simple explosion effect, e.g., removing terrain?
    // For now, no terrain destruction
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTerrain();
    drawWorms();
    drawProjectiles();
}

function drawTerrain() {
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for(let x=0; x<terrainWidth; x++) {
        ctx.lineTo(x, terrain[x]);
    }
    ctx.lineTo(terrainWidth, canvas.height);
    ctx.closePath();
    ctx.fill();
}

function drawWorms() {
    for(let worm of worms) {
        if(worm.alive) {
            ctx.fillStyle = worm.color;
            ctx.fillRect(worm.x - worm.width/2, worm.y - worm.height, worm.width, worm.height);
            // Health bar
            ctx.fillStyle='red';
            ctx.fillRect(worm.x -10, worm.y - worm.height - 5, 20, 3);
            ctx.fillStyle='green';
            ctx.fillRect(worm.x -10, worm.y - worm.height - 5, 20 * (worm.health/100), 3);
        }
    }
}

function drawProjectiles() {
    ctx.fillStyle='black';
    for(let p of projectiles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
        ctx.fill();
    }
}

function checkGameOver() {
    const aliveWorms = worms.filter(w=>w.alive);
    if(aliveWorms.length <=1) {
        gameOver(aliveWorms[0]);
    }
}

function gameOver(winner) {
    gameState='ended';
    statusDiv.innerText = 'Game Over! Winner: Player ' + (winner.id+1);
}

// Initialize game
init();