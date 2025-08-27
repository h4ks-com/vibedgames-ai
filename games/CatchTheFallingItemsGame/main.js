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
let level = 1;
let spawnInterval = 2000;
let lastSpawnTime = 0;
let objects = [];

const basket = {
    width: 120,
    height: 60,
    x: 0,
    y: 0,
    speed: 20,
    draw: function() {
        ctx.fillStyle = 'saddleBrown';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = 'darkred';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
};

function initBasket() {
    basket.x = (canvas.width - basket.width) / 2;
    basket.y = canvas.height - basket.height - 10;
}

window.addEventListener('resize', initBasket);

canvas.addEventListener('mousemove', (e) => {
    basket.x = e.clientX - basket.width / 2;
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;
});

canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
        basket.x = e.touches[0].clientX - basket.width / 2;
        if (basket.x < 0) basket.x = 0;
        if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;
    }
});

function FallingObject(x, y, speed) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.speed = speed;
    this.caught = false;
}

FallingObject.prototype.update = function(deltaTime) {
    this.y += this.speed * deltaTime;
};

FallingObject.prototype.draw = function() {
    ctx.fillStyle = 'tomato';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
};

function spawnObject() {
    const x = Math.random() * (canvas.width - 30);
    const speed = 100 + (level - 1) * 20;
    objects.push(new FallingObject(x, -30, speed));
}

function checkCollision(obj) {
    const basketCenterX = basket.x + basket.width / 2;
    const basketCenterY = basket.y + basket.height / 2;
    const distX = Math.abs(obj.x - basketCenterX); 
    const distY = Math.abs(obj.y - basketCenterY); 
    return (distX < obj.size + basket.width / 2) && (distY < obj.size + basket.height / 2); 
}

let lastTime = 0;
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEFA');
    gradient.addColorStop(1, '#E0FFFF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    basket.draw();

    for (let i = objects.length - 1; i >= 0; i--) {
        let obj = objects[i];
        obj.update(deltaTime);
        if (checkCollision(obj)) {
            score += 10;
            objects.splice(i, 1);
        } else if (obj.y > canvas.height) {
            objects.splice(i, 1);
            score -= 5;
        } else {
            obj.draw();
        }
    }

    if ((performance.now() - lastSpawnTime) > spawnInterval) {
        spawnObject();
        lastSpawnTime = performance.now();
    }

    ctx.fillStyle = "black";
    ctx.font = "24px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    ctx.fillText("Score: " + score, 20, 30);

    if (score > level * 100) {
        level += 1;
        spawnInterval = Math.max(500, spawnInterval - 200);
    }

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    } else {
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
    spawnInterval = 2000;
    objects = [];
    gameRunning = true;
    lastSpawnTime = performance.now();
    initBasket();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        startGame();
    }
});

initBasket();
startGame();