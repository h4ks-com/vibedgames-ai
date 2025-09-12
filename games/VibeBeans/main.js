// Platformer Jump! with ball, red enemies, death effects, and multiple levels
(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Resize canvas to viewport
  function resize(){
    canvas.width = Math.max(window.innerWidth, 400);
    canvas.height = Math.max(window.innerHeight, 300);
  }
  window.addEventListener('resize', resize);
  resize();

  // Jump sound via CDN (lazy-load). Replace URL with your CDN asset if needed.
  const jumpSoundUrl = 'https://cdn.jsdelivr.net/gh/your-collection/sounds/jump.mp3'; // replace with a valid CDN URL
  const jumpAudio = new Audio(jumpSoundUrl);
  jumpAudio.preload = 'auto';
  jumpAudio.crossOrigin = 'anonymous';
  function playJumpSound(){
    try {
      jumpAudio.currentTime = 0;
      jumpAudio.play().catch(()=>{});
    } catch(e) {}
  }

  // Levels defined as relative coordinates for responsive layouts
  const levelsRel = [
    {
      platforms: [
        {x:0,   y:0.88, w:1,   h:0.12}, // floor
        {x:0.15, y:0.65, w:0.25, h:0.04},
        {x:0.55, y:0.5,  w:0.25, h:0.04},
        {x:0.82, y:0.38, w:0.16, h:0.04}
      ],
      exit: {x:0.92, y:0.34, w:0.06, h:0.08},
      enemies: [ {x:0.4, y:0.58, w:0.04, h:0.04} ]
    },
    {
      platforms: [
        {x:0, y:0.88, w:1, h:0.12},
        {x:0.1, y:0.72, w:0.3, h:0.04},
        {x:0.5, y:0.60, w:0.25, h:0.04},
        {x:0.8, y:0.48, w:0.18, h:0.04}
      ],
      exit: {x:0.92, y:0.38, w:0.06, h:0.08},
      enemies: [ {x:0.25, y:0.64, w:0.04, h:0.04}, {x:0.65, y:0.52, w:0.04, h:0.04} ]
    },
    {
      platforms: [
        {x:0, y:0.88, w:1, h:0.12},
        {x:0.2, y:0.76, w:0.25, h:0.04},
        {x:0.45, y:0.62, w:0.3, h:0.04},
        {x:0.8, y:0.50, w:0.18, h:0.04}
      ],
      exit: {x:0.93, y:0.42, w:0.05, h:0.08},
      enemies: [ {x:0.35, y:0.70, w:0.04, h:0.04}, {x:0.65, y:0.60, w:0.04, h:0.04} ]
    }
  ];

  // Game state
  let levelIndex = 0;
  let levels = []; // absolute levels generated from levelsRel with current canvas size

  // Player attributes
  const player = { x: 60, y: 0, r: 14, vx: 0, vy: 0, onGround: false, alive: true };
  const gravity = 1800;
  const jumpVel = 560;

  // Level data
  let platforms = [];
  let enemies = [];
  let exitRect = null;

  // Death particles
  let particles = [];

  // Input
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  // UI overlay for level transitions
  const overlay = document.getElementById('overlay');
  const nextBtn = document.getElementById('nextBtn');
  const restartBtn = document.getElementById('restartBtn');
  function showOverlay(){ overlay.classList.remove('hidden'); }
  function hideOverlay(){ overlay.classList.add('hidden'); }
  nextBtn.addEventListener('click', ()=>{
    if (levelIndex < levels.length - 1) {
      levelIndex++;
      resetLevel(levelIndex);
      hideOverlay();
    } else {
      // Restart from level 0
      levelIndex = 0;
      resetLevel(levelIndex);
      hideOverlay();
    }
  });
  restartBtn.addEventListener('click', ()=>{
    levelIndex = 0;
    resetLevel(levelIndex);
    hideOverlay();
  });

  // Helpers
  function toAbs(r){ return { x: r.x * canvas.width, y: r.y * canvas.height, w: r.w * canvas.width, h: r.h * canvas.height }; }
  function spawnDeathParticles(x, y, color){
    for(let i=0;i<40;i++){
      particles.push({ x, y, vx: (Math.random()*2-1)*180, vy: (Math.random()*-1.5-0.5)*180, life: 1, color });
    }
  }
  function circleRectCollision(px, py, pr, rx, ry, rw, rh){
    const cx = Math.min(Math.max(px, rx), rx+rw);
    const cy = Math.min(Math.max(py, ry), ry+rh);
    const dx = px - cx, dy = py - cy;
    return (dx*dx + dy*dy) < (pr*pr);
  }

  // Level creation from relative data
  function resetLevel(idx){
    const rel = levelsRel[idx];
    // convert to absolute coordinates
    platforms = (rel.platforms || []).map(p => toAbs(p));
    enemies = (rel.enemies || []).map(e => ({...toAbs(e), dir: 1}));
    exitRect = toAbs(rel.exit || {x:0.9, y:0.2, w:0.05, h:0.08});
    // reset player
    player.x = 60; player.y = 0; player.vx = 0; player.vy = 0; player.onGround = false; player.alive = true;
    // spawn a fresh death particles list
    particles = [];
    // spawn a bit of perspective fog by drawing a light overlay later
  }

  // Init levels array with current canvas size
  function buildLevels(){ levels = levelsRel.map(rel => rel); }

  // Update game
  let last = performance.now();
  function update(dt){
    if(!player.alive) return;
    // horizontal input
    const acc = 1200;
    if (keys['ArrowLeft'] || keys['a']) player.vx -= acc * dt;
    if (keys['ArrowRight'] || keys['d']) player.vx += acc * dt;
    // friction
    if (!keys['ArrowLeft'] && !keys['a'] && !keys['ArrowRight'] && !keys['d']) player.vx *= 0.92;
    // cap speed
    const maxSpd = 420; if (player.vx > maxSpd) player.vx = maxSpd; if (player.vx < -maxSpd) player.vx = -maxSpd;
    // jump
    if ((keys[' '] || keys['ArrowUp'] || keys['w']) && player.onGround){ player.vy = -jumpVel; player.onGround = false; playJumpSound(); }

    // gravity
    player.vy += gravity * dt;
    // integrate
    player.x += player.vx * dt; player.y += player.vy * dt;

    // collisions with platforms
    player.onGround = false;
    for (const p of platforms){
      if (circleRectCollision(player.x, player.y, player.r, p.x, p.y, p.w, p.h)){
        // resolve
        if (player.vy > 0){ player.y = p.y - player.r; player.vy = 0; player.onGround = true; }
        else if (player.vy < 0){ player.y = p.y + p.h + player.r; player.vy = 0; }
        else { // horizontal push
          if (player.x < p.x) player.x = p.x - player.r; else player.x = p.x + p.w + player.r;
        }
      }
    }

    // world bounds
    if (player.x < player.r) { player.x = player.r; player.vx = 0; }
    if (player.x > canvas.width - player.r) { player.x = canvas.width - player.r; player.vx = 0; }
    if (player.y > canvas.height + 100) {
      die();
    }

    // enemies behavior and collision
    for (const e of enemies){
      // patrol
      e.x += e.dir * 60 * dt;
      if (e.x < 20 || e.x + e.w > canvas.width - 20) e.dir *= -1;
      // collision with player
      const dx = (player.x) - (e.x + e.w/2);
      const dy = (player.y) - (e.y + e.h/2);
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < player.r + Math.max(e.w,e.h)/2){
        if (player.vy > 0 && (player.y < e.y)){
          player.vy = -jumpVel * 0.6;
          spawnDeathParticles(e.x + e.w/2, e.y + e.h/2, '#e11d43');
        } else {
          die();
        }
      }
    }

    // exit check
    if (player.x > exitRect.x && player.x < exitRect.x + exitRect.w &&
        player.y > exitRect.y && player.y < exitRect.y + exitRect.h){
      // level complete
      completeLevel();
    }

    // particles update
    for (let i=particles.length-1; i>=0; i--){
      const p = particles[i];
      p.life -= dt; if (p.life <= 0){ particles.splice(i,1); continue; }
      p.vy += 1200 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }

  function completeLevel(){
    showOverlay();
    document.getElementById('overlayTitle').textContent = 'Stage Cleared!';
    document.getElementById('overlayDesc').textContent = 'Proceed to the next level or restart to try again.';
  }
  function die(){
    if (!player.alive) return;
    player.alive = false;
    spawnDeathParticles(player.x, player.y, '#f87171');
    showOverlay();
    document.getElementById('overlayTitle').textContent = 'You Died';
    document.getElementById('overlayDesc').textContent = 'Try the level again or go to the next level.';
  }

  // Rendering
  function render(){
    // background
    ctx.clearRect(0,0,canvas.width, canvas.height);
    const g = ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0, '#0b1020'); g.addColorStop(1, '#0b1020');
    ctx.fillStyle = g; ctx.fillRect(0,0, canvas.width, canvas.height);

    // platforms
    ctx.fillStyle = '#1e293b';
    for (const p of platforms) ctx.fillRect(p.x, p.y, p.w, p.h);
    // exit
    ctx.fillStyle = '#22c55e'; if (exitRect) ctx.fillRect(exitRect.x, exitRect.y, exitRect.w, exitRect.h);
    // enemies (red)
    ctx.fillStyle = '#e11d48'; for (const e of enemies) ctx.fillRect(e.x, e.y, e.w, e.h);
    // player (ball)
    ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();
    // particles
    for (const p of particles){ ctx.fillStyle = p.color || '#f472b6'; ctx.fillRect(p.x, p.y, 3, 3); }
  }

  // Input loop
  function loop(now){
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (player.alive) update(dt);
    render();
    requestAnimationFrame(loop);
  }

  // Initialize levels
  function init(){
    buildLevels();
    levelIndex = 0;
    resetLevel(levelIndex);
    last = performance.now();
    requestAnimationFrame(loop);
  }
  init();

})();
