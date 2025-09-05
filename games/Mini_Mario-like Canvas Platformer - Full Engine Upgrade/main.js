(function(){
  // Mini Mario-like Canvas Platformer - robust engine skeleton
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // DPR-aware sizing
  const BASE_W = 960;
  const BASE_H = 540;
  function fitCanvas(){
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    canvas.style.width = BASE_W + 'px';
    canvas.style.height = BASE_H + 'px';
    canvas.width = Math.floor(BASE_W * dpr);
    canvas.height = Math.floor(BASE_H * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  // World constants
  const WORLD_W = 2000; // level width (data-driven later)
  const WORLD_H = 540;
  const GROUND_Y = 500;

  // Simple vector helper
  class Vec2 { constructor(x=0,y=0){ this.x=x; this.y=y; } }

  // AABB helper
  function aabb(a, b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function rectAt(x,y,w,h){ return {x,y,w,h}; }

  // Texture: brick pattern for platforms
  function createBrickPattern(){
    const t = document.createElement('canvas'); t.width = 40; t.height = 40; const tt = t.getContext('2d');
    tt.fillStyle = '#8b5a2b'; tt.fillRect(0,0,40,40);
    tt.fillStyle = '#a56d41'; tt.fillRect(0,0,20,20); tt.fillRect(20,20,20,20);
    tt.strokeStyle = 'rgba(0,0,0,.15)'; tt.lineWidth = 1; tt.strokeRect(0,0,40,40);
    return ctx.createPattern(t,'repeat');
  }
  const platTexture = createBrickPattern();

  // Entities
  class Platform{ constructor(x,y,w,h){ this.x=x; this.y=y; this.w=w; this.h=h; } render(ctx, camX){ ctx.fillStyle = platTexture; ctx.fillRect(this.x - camX, this.y, this.w, this.h);
      // subtle top highlight
      ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(this.x - camX, this.y, this.w, 4);
    } }
  class Coin{ constructor(x,y,r){ this.x=x; this.y=y; this.r=r; this.collected=false; } render(ctx, camX){ if(this.collected) return; ctx.fillStyle = '#f7d046'; ctx.beginPath(); ctx.arc(this.x - camX, this.y, this.r, 0, Math.PI*2); ctx.fill(); }
        collectIfOverlap(player){ if(this.collected) return false; const cx = player.x + player.w/2; const cy = player.y + player.h/2; const d = Math.hypot(this.x - cx, this.y - cy); if(d < this.r + Math.max(player.w, player.h)/2){ this.collected = true; return true; } return false; }
    }
  class Enemy{ constructor(x,y,w,h,patMin,patMax){ this.x=x; this.y=y; this.w=w; this.h=h; this.patMinX=patMin; this.patMaxX=patMax; this.vx = 60; } update(dt){ this.x += this.vx*dt; if(this.x < this.patMinX){ this.x = this.patMinX; this.vx = Math.abs(this.vx); } else if(this.x + this.w > this.patMaxX){ this.x = this.patMaxX - this.w; this.vx = -Math.abs(this.vx); } } render(ctx, camX){ ctx.fillStyle = '#e74c3c'; ctx.fillRect(this.x - camX, this.y, this.w, this.h); }
    }
  class Flag{ constructor(x,y,w,h){ this.x=x; this.y=y; this.w=w; this.h=h; this.activated=false; } render(ctx, camX){ // simple flag pole and banner
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(this.x - camX, this.y - this.h, 6, this.h);
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(this.x - camX, this.y - 6, this.w, 6);
    } checkReached(player){ const hit = aabb({x: player.x, y: player.y, w: player.w, h: player.h}, {x: this.x, y: this.y - this.h, w:this.w, h:this.h}); if(hit){ this.activated = true; } return hit; }
    }

  // Level data (single, small sample as per task guidance)
  const levelData = {
    name: 'Level 1', width: 2000, height: 540,
    start: {x: 50, y: GROUND_Y - 60},
    platforms: [
      {x:0, y:GROUND_Y, w:2000, h:40},
      {x:150, y:420, w:180, h:18},
      {x:420, y:360, w:180, h:18},
      {x:710, y:320, w:180, h:18},
      {x:980, y:260, w:150, h:18},
      {x:1250, y:230, w:180, h:18},
      {x:1500, y:310, w:180, h:18}
    ],
    coins: [ {x:180, y:410, r:8}, {x:260, y:380, r:8}, {x:420, y:340, r:8}, {x:760, y:300, r:8}, {x:1040, y:240, r:8}, {x:1320, y:210, r:8}, {x:1700, y:280, r:8} ],
    enemy: {x:520, y:420, w:40, h:40, patrolMinX:520, patrolMaxX:760},
    flag: {x:1900, y: 180, w: 40, h: 60}
  };

  // Game state instance
  class Level{
    constructor(data){ this.name = data.name; this.width = data.width; this.height = data.height; this.start = data.start; this.platforms = data.platforms.map(p => new Platform(p.x,p.y,p.w,p.h)); this.coins = data.coins.map(c => new Coin(c.x,c.y,c.r)); this.enemies = [ new Enemy(data.enemy.x, data.enemy.y, data.enemy.w, data.enemy.h, data.enemy.patrolMinX, data.enemy.patrolMaxX) ]; this.flag = new Flag(data.flag.x, data.flag.y, data.flag.w, data.flag.h); this.collectedCoins = 0; }
    reset(){ this.coins.forEach(c => c.collected = false); this.collectedCoins = 0; this.enemies.forEach(e => { /* reset positions if needed */ }); }
  }

  // Instantiate level
  let level = new Level(levelData);

  // Player
  const player = { x: level.start.x, y: level.start.y, w: 40, h: 60, vx: 0, vy: 0, onGround: false };

  // Camera
  let cameraX = 0;
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  // Input management (keyboard + optional on-screen overlay)
  const input = {
    left:false, right:false, jump:false,
    hasJumpBuffer:false, jumpBufferTime:0
  };
  const keyMap = {
    ArrowLeft:'left', KeyA:'left',
    ArrowRight:'right', KeyD:'right',
    Space:'jump', KeyW:'jump'
  };
  window.addEventListener('keydown', (e) => {
    const key = keyMap[e.code]; if(!key) return; input[key] = true; e.preventDefault();
    if(key==='jump'){ input.hasJumpBuffer = true; input.jumpBufferTime = 0; }
  });
  window.addEventListener('keyup', (e)=>{ const key = keyMap[e.code]; if(!key) return; input[key] = false; e.preventDefault(); });

  // Simple on-screen touch controls if present (reuse from HTML in index.html)
  function isTouchActive(action){ return !!input[action]; }

  // HUD elements (backwards compatibility)
  const scoreEl = document.getElementById('score');
  function setScore(n){ if(scoreEl){ scoreEl.textContent = 'Score: ' + Math.floor(n); } }
  function setTime(t){ const tEl = document.getElementById('time'); if(tEl){ tEl.textContent = 'Time: ' + Math.floor(t); } }

  // Brisk rendering helpers
  function drawSkyGradient(){ const g = ctx.createLinearGradient(0,0,0,BASE_H); g.addColorStop(0,'#6cc6ff'); g.addColorStop(0.5,'#4a9bdc'); g.addColorStop(1,'#1b2a60'); ctx.fillStyle = g; ctx.fillRect(0,0,BASE_W,BASE_H); }
  const clouds = [ {x:-120,y:60,s:1.0}, {x:300,y:90,s:.8}, {x:700,y:40,s:1.1} ];
  function drawClouds(dt){ for(const c of clouds){ c.x += 20 * dt * 0.03 * c.s; if(c.x > level.width) c.x = -200; ctx.globalAlpha = 0.6; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 60*c.s, 25*c.s, 0,0,Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; } }

  // Fixed-step loop vars
  const FIXED_DT = 1/60; let acc = 0; let last = performance.now();
  let paused = false; let debug = false; // debug hitboxes

  // Level data for anchors
  function resetToStart(){ player.x = level.start.x; player.y = level.start.y; player.vx = 0; player.vy = 0; level.collectedCoins = 0; level.coins.forEach(c => c.collected = false); }
  resetToStart();

  // Core update logic
  function update(dt){ if(paused) return; // dt already clamped per loop
    // Input smoothing
    let dir = 0; if(input.left) dir -= 1; if(input.right) dir += 1;
    const MOVE_ACC = 1000; const MAX_SPEED = 260; const FRICTION = 0.9; const GRAVITY = 1000; const JUMP_V = 420;

    // Horizontal
    if(dir !== 0){ player.vx += dir * MOVE_ACC * dt; }
    else { player.vx *= FRICTION; if (Math.abs(player.vx) < 0.5) player.vx = 0; }
    // Jump buffering: if jump pressed recently and onGround, jump
    if (input.jump && player.onGround){ player.vy = -JUMP_V; player.onGround = false; input.jump = false; }
    // Vertical motion
    player.vy += GRAVITY * dt; if (player.vy > 900) player.vy = 900;

    // Proposed next position
    let nextX = player.x + player.vx * dt;
    let nextY = player.y + player.vy * dt;

    // Collision resolution with platforms (AABB) - first horizontal
    for(const plat of level.platforms){ // horizontal
      if (nextY + player.h > plat.y && nextY < plat.y + plat.h){
        if (nextX + player.w > plat.x && player.x < plat.x + plat.w){
          if (player.vx > 0) nextX = plat.x - player.w; else if (player.vx < 0) nextX = plat.x + plat.w; player.vx = 0; break;
        }
      }
    }
    // Then vertical
    nextY = player.y + player.vy * dt;
    player.onGround = false;
    for(const plat of level.platforms){ if (nextX + player.w > plat.x && nextX < plat.x + plat.w){ if (nextY + player.h > plat.y && player.y + player.h <= plat.y){ nextY = plat.y - player.h; player.vy = 0; player.onGround = true; } else if (player.vy < 0 && nextY < plat.y + plat.h){ nextY = plat.y + plat.h; player.vy = 0; } } }

    player.x = nextX; player.y = nextY;
    // World bounds
    if (player.x < 0) { player.x = 0; player.vx = 0; }
    if (player.x + player.w > level.width) { player.x = level.width - player.w; player.vx = 0; }
    if (player.y + player.h > level.height){ resetToStart(); }

    // Coin collection
    for(const c of level.coins){ if(!c.collected && c.collectIfOverlap && c.collectIfOverlap(player)) { level.collectedCoins++; /* Score can be increased here later */ } }

    // Enemy collision -> reset for simplicity
    for(const e of level.enemies){ // basic AABB check
      if (aabb({x: player.x, y: player.y, w: player.w, h: player.h}, {x: e.x, y: e.y, w: e.w, h: e.h})) { resetToStart(); break; }
    }

    // Flag check
    if (level.flag.checkReached({x: player.x, y: player.y, w: player.w, h: player.h})){
      paused = true; // Level complete overlay would be shown in render
    }

    // Camera follows
    cameraX = Math.floor(player.x - BASE_W/2);
    cameraX = clamp(cameraX, 0, level.width - BASE_W);
  }

  // Rendering
  function render(){ // sky
    ctx.clearRect(0,0,BASE_W,BASE_H);
    drawSkyGradient(); drawClouds(1/60);
    // Translate world by camera
    ctx.save(); ctx.translate(-cameraX, 0);
    // Ground and platforms
    drawPlatforms();
    // coins
    for(const c of level.coins){ if(!c.collected) c.render(ctx, cameraX); }
    // enemy
    for(const e of level.enemies){ e.render(ctx, cameraX); }
    // flag
    level.flag.render(ctx, cameraX);
    // player
    // simple character
    ctx.fillStyle = '#2e7bd6'; ctx.fillRect(player.x, player.y, player.w, player.h);
    // optional hitboxes if debug
    if(debug){ ctx.strokeStyle='red'; ctx.strokeRect(player.x, player.y, player.w, player.h); level.platforms.forEach(p=>{ ctx.strokeStyle='#ff0'; ctx.strokeRect(p.x, p.y, p.w, p.h); }); }
    ctx.restore();

    // HUD text (fallback if score elements exist)
    // Score from coins + time is optional here; keep a basic timer/score in UI
    // We'll reuse 'score' element if present
    if (typeof hudScore === 'function') hudScore();
  }

  // Rendering helpers used in render()
  function drawSkyGradient(){ const g = ctx.createLinearGradient(0,0,0,BASE_H); g.addColorStop(0,'#87cefa'); g.addColorStop(0.5,'#6ba4ff'); g.addColorStop(1,'#1e1e1e'); ctx.fillStyle = g; ctx.fillRect(0,0,BASE_W,BASE_H); }
  function drawPlatforms(){ ctx.fillStyle = platTexture; for(const p of level.platforms){ ctx.fillRect(p.x, p.y, p.w, p.h); } // subtle top glow
    for(const p of level.platforms){ const grd = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h); grd.addColorStop(0, 'rgba(255,255,255,.25)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = grd; ctx.fillRect(p.x, p.y, p.w, p.h); }
  }
  function drawClouds(dt){ for(const c of clouds){ c.x += 20 * dt * 0.03 * c.s; if (c.x > level.width) c.x = -200; ctx.globalAlpha = 0.6; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 60*c.s, 25*c.s, 0, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; } }

  // Main loop
  let timeAccumulator = 0; let timeElapsed = 0; let lastTime = performance.now();
  let levelComplete = false;
  function loop(now){ const dt = Math.min(0.033, (now - lastTime) / 1000); lastTime = now; timeAccumulator += dt;
    while(timeAccumulator >= FIXED_DT){ update(FIXED_DT); timeAccumulator -= FIXED_DT; timeElapsed += FIXED_DT; }
    render();
    requestAnimationFrame(loop);
  }
  const FIXED_DT = 1/60;

  // Pause toggling via P key
  window.addEventListener('keydown', (e)=>{ if(e.code === 'KeyP'){ paused = !paused; } });

  // Basic score/time UI update (graceful if DOM missing)
  function hudLoop(){ setScore(level.collectedCoins); setTime(timeElapsed); requestAnimationFrame(hudLoop); }
  function setScore(n){ if (typeof scoreEl !== 'undefined' && scoreEl){ scoreEl.textContent = 'Score: ' + Math.floor(n); } }
  // start
  const scoreElLegacy = document.getElementById('score');
  // Link DOM helpers by closure
  function initHUD(){ if(scoreElLegacy){ /* no action required here; update in loop */ } }
  initHUD();

  // Start
  // Initialize simple AI enemy in level
  level.enemies[0].x = levelData.enemy.x; level.enemies[0].y = levelData.enemy.y;
  // To keep things working with existing HTML, ensure references exist
  window.addEventListener('load', ()=>{ /* placeholder for future */ });

  // Start the game loop
  // initial background draw to avoid blank
  drawSkyGradient(); render();
  requestAnimationFrame(loop);
})();