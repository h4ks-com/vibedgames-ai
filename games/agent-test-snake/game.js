(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const overlay = document.getElementById('overlay');
  const overlayScore = document.getElementById('overlay-score');
  const restartBtn = document.getElementById('restart-btn');

  const GRID = 20;
  const COLS = canvas.width / GRID;
  const ROWS = canvas.height / GRID;
  const TICK_MS = 120;

  let snake, dir, nextDir, food, score, alive, loopId;

  function init() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = { ...dir };
    score = 0;
    alive = true;
    scoreEl.textContent = 0;
    overlay.classList.add('hidden');
    placeFood();
    if (loopId) clearInterval(loopId);
    loopId = setInterval(tick, TICK_MS);
  }

  function placeFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  function tick() {
    if (!alive) return;
    dir = { ...nextDir };

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return die();
    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) return die();

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = score;
      placeFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function die() {
    alive = false;
    clearInterval(loopId);
    overlayScore.textContent = `Final score: ${score}`;
    overlay.classList.remove('hidden');
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Food
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(food.x * GRID + GRID / 2, food.y * GRID + GRID / 2, GRID / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Snake
    snake.forEach((seg, i) => {
      const brightness = i === 0 ? '#4ecca3' : `hsl(160, 60%, ${50 - i * 0.8}%)`;
      ctx.fillStyle = brightness;
      ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 1;
      ctx.strokeRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
    });
  }

  // Controls — prevent 180° reversal
  document.addEventListener('keydown', e => {
    if (!alive) return;
    const map = {
      ArrowUp:    { x:  0, y: -1 },
      ArrowDown:  { x:  0, y:  1 },
      ArrowLeft:  { x: -1, y:  0 },
      ArrowRight: { x:  1, y:  0 },
    };
    const nd = map[e.key];
    if (!nd) return;
    e.preventDefault();
    if (nd.x === -dir.x && nd.y === -dir.y) return; // no 180
    nextDir = nd;
  });

  restartBtn.addEventListener('click', init);

  init();
})();
