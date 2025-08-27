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

function FallingObject(x, y, speed, shape, color) {
    this.x = x;
    this.y = y;
    this.shape = shape; // 'circle', 'rect', or 'triangle'
    this.color = color;
    this.size = 30;
    this.speed = speed;
    this.caught = false;
}

FallingObject.prototype.update = function(deltaTime) {
    this.y += this.speed * deltaTime;
};

FallingObject.prototype.draw = function() {
    ctx.fillStyle = this.color;
    if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (this.shape === 'rect') {
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    } else if (this.shape === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size / 2);
        ctx.lineTo(this.x - this.size / 2, this.y + this.size / 2);
        ctx.lineTo(this.x + this.size / 2, this.y + this.size / 2);
        ctx.closePath();
        ctx.fill();
    }
};

function spawnObject() {
    const x = Math.random() * (canvas.width - 30) + 15;
    const speed = 100 + (level - 1) * 20;
    const shapes = ['circle', 'rect', 'triangle'];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const colors = ['tomato', 'orange', 'yellowgreen', 'purple', 'cyan', 'magenta', 'lime', 'pink'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    objects.push(new FallingObject(x, -30, speed, shape, color));
}

function checkCollision(obj) {
    const basketCenterX = basket.x + basket.width / 2;
    const basketCenterY = basket.y + basket.height / 2;
    // Approximate collision detection
    if (obj.shape === 'circle') {
        const dx = obj.x - (basketCenterX);
        const dy = obj.y - (basketCenterY);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < obj.size / 2 + Math.min(basket.width, basket.height) / 2;
    } else {
        // For rect and triangle, approximate with bounding box
        const left = basket.x;
        const right = basket.x + basket.width;
        const top = basket.y;
        const bottom = basket.y + basket.height;
        return (
            obj.x + obj.size / 2 > left &&
            obj.x - obj.size / 2 < right &&
            obj.y + obj.size / 2 > top &&
            obj.y - obj.size / 2 < bottom
        );
    }
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

    // Draw clouds
    ctx.fillStyle = 'white';
    for (let i = 0; i < 5; i++) {
        const cloudX = Math.random() * canvas.width;
        const cloudY = Math.random() * canvas.height / 3;
        const cloudSize = 50 + Math.random() * 50;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, cloudSize / 2, 0, Math.PI * 2);
        ctx.arc(cloudX + cloudSize / 2, cloudY, cloudSize / 2, 0, Math.PI * 2);
        ctx.arc(cloudX + cloudSize * 0.25, cloudY - cloudSize / 3, cloudSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    // Draw basket
    ctx.fillStyle = 'saddleBrown';
    ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
    ctx.strokeStyle = 'darkred';
    ctx.lineWidth = 4;
    ctx.strokeRect(basket.x, basket.y, basket.width, basket.height);

    // Update and draw objects
    for (let i = objects.length - 1; i >= 0; i--) {
        let obj = objects[i];
        obj.update(deltaTime);
        if (checkCollision(obj)) {
            score += 10;
            objects.splice(i, 1);
        } else if (obj.y > canvas.height + obj.size) {
            objects.splice(i, 1);
            score = Math.max(0, score - 5);
        } else {
            obj.draw();
        }
    }

    // Spawn new object
    if ((performance.now() - lastSpawnTime) > spawnInterval) {
        spawnObject();
        lastSpawnTime = performance.now();
    }

    // Draw score
    ctx.fillStyle = "black";
    ctx.font = "24px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    ctx.fillText("Score: " + score, 20, 30);

    // Level up
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

// Initialize basket position
function initBasket() {
    basket.x = (canvas.width - basket.width) / 2;
    basket.y = canvas.height - basket.height - 10;
}

initBasket();
startGame();