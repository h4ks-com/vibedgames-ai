const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game variables
let gameState = {
    player: {
        x: 100,
        y: 500,
        width: 50,
        height: 50,
        isLaunching: false,
        launchPower: 0,
        angle: 45,
        velocityX: 0,
        velocityY: 0,
        isInFlight: false
    },
    rockets: [],
    gravity: 0.4,
    resources: {
        fuel: 100
    },
    keys: {},
    gameOver: false,
    score: 0
};

// UI elements
const launchAngleInput = document.getElementById('launchAngle');
const launchForceRange = document.getElementById('launchForce');
const launchButton = document.getElementById('launchBtn');
const statusDiv = document.getElementById('status');

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
});

// Main game loop
function gameLoop() {
    update();
    draw();
    if (!gameState.gameOver) {
        requestAnimationFrame(gameLoop);
    } else {
        drawGameOver();
    }
}

// Update game state
function update() {
    const player = gameState.player;
    // Player movement
    if (gameState.keys['ArrowLeft']) {
        player.x -= 5;
    }
    if (gameState.keys['ArrowRight']) {
        player.x += 5;
    }
    // Aiming controls
    if (gameState.keys['ArrowUp']) {
        player.angle -= 1;
        if (player.angle < 0) player.angle = 0;
        launchAngleInput.value = player.angle;
    }
    if (gameState.keys['ArrowDown']) {
        player.angle += 1;
        if (player.angle > 90) player.angle = 90;
        launchAngleInput.value = player.angle;
    }
    // Launch control
    // The launch button event listeners are set outside this; but for continuous building, incorporate here
    if (player.isLaunching && player.launchPower < 20) {
        player.launchPower += 0.1;
        launchForceRange.value = Math.round(player.launchPower * 5);
    }
    // Rocket movement
    for (let i = gameState.rockets.length - 1; i >= 0; i--) {
        const rocket = gameState.rockets[i];
        rocket.x += rocket.velocityX;
        rocket.y += rocket.velocityY;
        rocket.velocityY += gameState.gravity;
        // Remove if out of bounds
        if (rocket.y > canvas.height + 20 || rocket.x < -20 || rocket.x > canvas.width + 20) {
            gameState.rockets.splice(i, 1);
        }
        if (rocket.y >= canvas.height - 20) {
            gameState.rockets.splice(i, 1);
            gameState.score += 10;
        }
    }
    // Update resource display
    document.getElementById('fuelBar').value = gameState.resources.fuel;
    document.getElementById('oxygenBar').value = 100;
    statusDiv.innerText = `Fuel: ${gameState.resources.fuel} | Score: ${gameState.score}`;
}

function draw() {
    ctx.fillStyle = 'linear-gradient(to bottom, #87ceeb, #f0e68c)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const groundGradient = ctx.createLinearGradient(0, canvas.height - 20, 0, canvas.height);
    groundGradient.addColorStop(0, '#654321');
    groundGradient.addColorStop(1, '#2e8b57');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    ctx.save();
    ctx.translate(gameState.player.x + gameState.player.width / 2, gameState.player.y + gameState.player.height / 2);
    ctx.rotate((-gameState.player.angle * Math.PI) / 180);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-25, -25, 50, 50);
    ctx.beginPath();
    ctx.arc(0, -35, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#A0522D';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-10, -50);
    ctx.lineTo(-5, -60);
    ctx.lineTo(0, -50);
    ctx.closePath();
    ctx.fillStyle = '#A0522D';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -50);
    ctx.lineTo(5, -60);
    ctx.lineTo(0, -50);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    gameState.rockets.forEach(rocket => {
        const gradient = ctx.createLinearGradient(rocket.x, rocket.y, rocket.x + 10, rocket.y + 20);
        gradient.addColorStop(0, '#888');
        gradient.addColorStop(1, '#444');
        ctx.fillStyle = gradient;
        ctx.fillRect(rocket.x, rocket.y, 10, 20);
    });
}

function launchRocket() {
    if (gameState.resources.fuel <= 0) return;
    const player = gameState.player;
    const angleRad = (player.angle * Math.PI) / 180;
    const power = player.launchPower;
    const velocityX = Math.cos(angleRad) * power;
    const velocityY = -Math.sin(angleRad) * power;
    gameState.rockets.push({
        x: player.x + player.width / 2,
        y: player.y,
        velocityX: velocityX,
        velocityY: velocityY
    });
    gameState.resources.fuel -= 1;
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
}

// Initialize launch power display
launchForceRange.value = Math.round(gameState.player.launchPower * 5);

// Event listeners for launch button
document.getElementById('launchBtn').addEventListener('mousedown', () => {
    if (!gameState.player.isInFlight && gameState.resources.fuel > 0) {
        gameState.player.isLaunching = true;
        gameState.player.launchPower += 0.5;
        if (gameState.player.launchPower > 20) {
            gameState.player.launchPower = 20;
        }
    }
});
document.getElementById('launchBtn').addEventListener('mouseup', () => {
    if (gameState.player.isLaunching) {
        launchRocket();
        gameState.player.isLaunching = false;
        gameState.player.launchPower = 0;
    }
});

// Start the game loop
gameLoop();