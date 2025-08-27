// Advanced setup for a visually appealing turn-based puzzle game with a story involving Mattf
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas sizing with high-DPI support
function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformations
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
resize();

// Game state variables
let gameState = 'intro'; // intro, playing, gameover
let score = 0;
let level = 1;
let challengeIndex = 0;
const challenges = [
    {type: 'code', difficulty: 1, description: "Simple variable assignment"},
    {type: 'logic', difficulty: 2, description: "Pattern recognition"},
    {type: 'timed', difficulty: 3, description: "Quick sequence puzzle"},
    // add more challenges for escalation
];

// Player tools with enhanced UI visuals
const tools = {
    'editor': {clicked: false, effect: 'modify code'},
    'debugger': {clicked: false, effect: 'find bug'}
};

// Mattf's AI defense
const mattf = {
    difficulty: 1,
    adapt() {
        this.difficulty++;
    }
};

// Define colors and textures for background and UI
const backgroundGradient = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
backgroundGradient.addColorStop(0, '#ffe0e5');
backgroundGradient.addColorStop(1, '#ffd1dc');

// Draw intro screen with textured background
function drawIntro() {
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(20, 50, window.innerWidth - 40, 100);
    ctx.fillStyle = '#555';
    ctx.font = '40px "Pacifico", cursive';
    ctx.textAlign = 'center';
    ctx.fillText('Welcome to Beat the Mattf!', window.innerWidth/2, 120);
    ctx.font = '20px "Pacifico", cursive';
    ctx.fillText('Press Enter to Start', window.innerWidth/2, 160);
}

// Main game loop with rich visuals
function gameLoop() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    // Draw animated textured background
    const gradientBg = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
    gradientBg.addColorStop(0, '#fff0f5');
    gradientBg.addColorStop(1, '#ffe6f0');
    ctx.fillStyle = gradientBg;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    if (gameState === 'intro') {
        drawIntro();
    } else if (gameState === 'playing') {
        // Draw challenge panel with textured background
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#999';
        ctx.shadowBlur = 10;
        ctx.roundRect(20, 20, window.innerWidth - 40, 100, 15).fill();
        ctx.restore();
        ctx.fillStyle = '#333';
        ctx.font = '22px "Comic Neue", cursive';
        ctx.textAlign = 'left';
        ctx.fillText('Challenge: ' + challenges[challengeIndex].description, 40, 70);
        ctx.fillText('Difficulty: ' + challenges[challengeIndex].difficulty, 40, 100);

        // Draw tools with vibrant icons
        const toolColors = {'editor': '#f4a7b9', 'debugger': '#89cff0'};
        let yPos = 140;
        for (let toolName in tools) {
            ctx.fillStyle = toolColors[toolName] || '#ccc';
            ctx.fillRoundRect(50, yPos, 150, 40, 8);
            ctx.fillStyle = '#222';
            ctx.font = '16px "Pacifico", cursive';
            ctx.textAlign = 'center';
            ctx.fillText(toolName + (tools[toolName].clicked?' [X]':' [ ]'), 125, yPos + 25);
            yPos += 50;
        }

        // Draw challenge completion button with a glossy effect
        ctx.fillStyle = '#66cc66';
        ctx.fillRoundRect(100, 300, 220, 60, 15);
        ctx.fillStyle = 'linear-gradient(to top, #99cc66, #66cc66)';
        ctx.font = '20px "Pacifico", cursive';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Complete Challenge', 210, 340);
    } else if (gameState === 'gameover') {
        // Draw animated pattern for game over
        ctx.fillStyle = 'radial-gradient(circle, #ffe6f0, #ffc0cb)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.fillStyle = '#555';
        ctx.font = '50px "Pacifico", cursive';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', window.innerWidth/2, window.innerHeight/2);
        ctx.font = '20px "Pacifico", cursive';
        ctx.fillText('Final Score: ' + score, window.innerWidth/2, window.innerHeight/2 + 40);
        ctx.fillText('Press R to Restart', window.innerWidth/2, window.innerHeight/2 + 80);
    }
    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);

// Input handling with visual feedback
document.addEventListener('keydown', (e) => {
    if (gameState === 'intro' && e.key === 'Enter') {
        gameState = 'playing';
    } else if (gameState === 'playing') {
        if (e.key === 'r' || e.key === 'R') {
            // Restart game
            score = 0;
            level = 1;
            challengeIndex = 0;
            gameState = 'intro';
        }
        // Additional controls like selecting tools, solving puzzles etc.
    } else if (gameState === 'gameover' && (e.key === 'r' || e.key === 'R')) {
        // Restart
        score = 0;
        level = 1;
        challengeIndex = 0;
        gameState = 'intro';
    }
});