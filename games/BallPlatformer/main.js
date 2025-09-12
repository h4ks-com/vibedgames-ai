// BallPlatformer Deluxe - Improved JS (audio enhanced, collision improvements, death animation)
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = window.innerWidth, H = window.innerHeight;
  function resize(){ W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; }
  window.addEventListener('resize', resize); resize();

  // Audio (Web Audio API)
  let audioCtx = null; let sfxOn = true; let musicOn = true;
  function ensureAudio(){ if (!audioCtx){ const A = window.AudioContext || window.webkitAudioContext; if (A) audioCtx = new A(); }}
  function playJumpTone(){ ensureAudio(); if(!audioCtx || !sfxOn) return; const t = audioCtx.currentTime; const osc = audioCtx.createOscillator(); const g = audioCtx.createGain(); osc.frequency.value = 520; g.gain.value = 0.18; osc.connect(g); g.connect(audioCtx.destination); osc.type='triangle'; osc.start(t); osc.frequency.exponentialRampToValueAtTime(0.001, t+0.25); g.gain.exponentialRampToValueAtTime(0.0001, t+0.25); osc.stop(t+0.3); }
  function playCoinSound(){ ensureAudio(); if(!audioCtx || !sfxOn) return; const t = audioCtx.currentTime; const osc = audioCtx.createOscillator(); const g = audioCtx.createGain(); osc.frequency.value = 380; g.gain.value = 0.12; osc.connect(g); g.connect(audioCtx.destination); osc.type='triangle'; osc.start(t); osc.frequency.exponentialRampToValueAtTime(0.001, t+0.15); g.gain.exponentialRampToValueAtTime(0.0001, t+0.15); osc.stop(t+0.2); }
  function playDeathSound(){ ensureAudio(); if(!audioCtx || !sfxOn) return; const t = audioCtx.currentTime; const osc = audioCtx.createOscillator(); const g = audioCtx.createGain(); osc.frequency.value = 180; g.gain.value = 0.25; osc.connect(g); g.connect(audioCtx.destination); osc.type='sine'; osc.start(t); osc.frequency.exponentialRampToValueAtTime(60, t+0.25); g.gain.exponentialRampToValueAtTime(0.0001, t+0.4); osc.stop(t+0.5); }

  // Level data
  const levels = [
    {
      name: 'Sunrise', width: 4200, height: 600,
      platforms: [ {x:0, y:520, w:1800, h:40}, {x:1200, y:420, w:600, h:40}, {x:2100, y:360, w:500, h:40}, {x:2700, y:500, w:400, h:40}, {x:3600, y:480, w:600, h:40} ],
      endZone: {x:3950, y:520, w:60, h:60}, enemies: [ {x:800, y:500, w:34, h:34, minX:700, maxX:1100, speed:60} ], coins: [ {x:650, y:480, r:8, collected:false}, {x:1500, y:420, r:8, collected:false}, {x:2300, y:320, r:8, collected:false} ], bg: '#1a1a1a'
    },
    {
      name: 'Midnight', width: 5400, height: 600,
      platforms: [ {x:0, y:520, w:2000, h:40}, {x:1800, y:420, w:240, h:40}, {x:2100, y:360, w:260, h:40}, {x:2400, y:420, w:400, h:40}, {x:3100, y:520, w:2000, h:40}, {x:4100, y:460, w:280, h:40} ],
      endZone: {x:5150, y:520, w:60, h:60}, enemies: [ {x:1500, y:500, w:34, h:34, minX:1400, maxX:1700, speed:80}, {x:3200, y:480, w:34, h:34, minX:3000, maxX:3600, speed:60} ], coins: [ {x:420, y:490, r:8, collected:false}, {x:1500, y:480, r:8, collected:false}, {x:3200, y:450, r:8, collected:false} ], bg: '#0b0b0b'
    },
    {
      name: 'Nebula', width: 6400, height: 600,
      platforms: [ {x:0, y:520, w:2500, h:40}, {x:2600, y:470, w:300, h:40}, {x:3000, y:420, w:300, h:40}, {x:3500, y:470, w:350, h:40}, {x:4200, y:520, w:1000, h:40}, {x:5200, y:420, w:300, h:40} ],
      endZone: {x:6100, y:520, w:60, h:60}, enemies: [ {x:500, y:500, w:34, h:34, minX:100, maxX:900, speed:90}, {x:4600, y:500, w:34, h:34, minX:4400, maxX:5200, speed:70} ], coins: [ {x:600, y:480, r:8, collected:false}, {x:5200, y:460, r:8, collected:false} ], bg: '#141021'
    }
  ];

  // World state
  let currentLevel = 0; let worldWidth = 0; let worldHeight = 0; let platforms = []; let enemies = []; let coins = []; let endZone = null;
  // Player
  const player = { x: 60, y: 0, vx: 0, vy: 0, r: 22, onGround: false, alive: true };
  // Trails / particles
  const trails = []; const particles = [];
  let score = 0; let coinsCollected = 0;

  // HUD refs
  const hudLevel = document.getElementById('hudLevel'); const hudScore = document.getElementById('hudScore'); const hudCoins = document.getElementById('hudCoins'); const hudBest = document.getElementById('hudBest');
  function updateHUD(){ const best = parseInt(localStorage.getItem('bestScore') || '0', 10); hudLevel.textContent = 'Level: ' + (currentLevel + 1); hudScore.textContent = 'Score: ' + score; hudCoins.textContent = 'Coins: ' + coinsCollected; hudBest.textContent = 'Best: ' + best; }

  // Overlay controls (reuse existing HTML overlay from index.html)
  const overlay = document.getElementById('overlay'); const startPanel = document.getElementById('startPanel'); const deathPanel = document.getElementById('deathPanel'); const levelCompletePanel = document.getElementById('levelCompletePanel'); const pausePanel = document.getElementById('pausePanel'); const levelSelectPanel = document.getElementById('levelSelectPanel'); const levelGridEl = document.getElementById('levelGrid'); const backFromLevelSelect = document.getElementById('backFromLevelSelect'); const settingsPanel = document.getElementById('settingsPanel'); const startBtn = document.getElementById('startBtn'); const levelSelectBtn = document.getElementById('levelSelectBtn'); const settingsBtn = document.getElementById('settingsBtn'); const restartBtn = document.getElementById('restartBtn'); const levelSelectFromDeathBtn = document.getElementById('levelSelectFromDeathBtn'); const continueBtn = document.getElementById('continueBtn'); const levelSelectFromCompleteBtn = document.getElementById('levelSelectFromCompleteBtn'); const resumeBtn = document.getElementById('resumeBtn'); const levelSelectFromPauseBtn = document.getElementById('levelSelectFromPauseBtn'); const closeSettings = document.getElementById('closeSettings');
  const gravSlider = document.getElementById('gravSlider'); const gravVal = document.getElementById('gravVal'); const jumpSlider = document.getElementById('jumpSlider'); const jumpVal = document.getElementById('jumpVal'); const fricSlider = document.getElementById('fricSlider'); const fricVal = document.getElementById('fricVal'); const trailToggle = document.getElementById('trailToggle'); const musicToggle = document.getElementById('musicToggle'); const sfxToggle = document.getElementById('sfxToggle');

  // State
  let gravity = 1600; let MAXVX = 260; let JUMP_VY = -520; let friction = 0.92; let trailsEnabled = true; let paused = false; let started = false; let inTransition = true; let transitionAlpha = 1; let camX = 0; let camShake = 0;

  // Input
  const keys = { left:false, right:false, up:false };
  window.addEventListener('keydown', (e)=>{ if (e.code==='ArrowLeft' || e.code==='KeyA') keys.left = true; if (e.code==='ArrowRight' || e.code==='KeyD') keys.right = true; if (e.code==='Space' || e.code==='ArrowUp' || e.code==='KeyW'){ keys.up = true; } if (e.code==='Escape' || e.code==='KeyP') togglePause(); });
  window.addEventListener('keyup', (e)=>{ if (e.code==='ArrowLeft' || e.code==='KeyA') keys.left = false; if (e.code==='ArrowRight' || e.code==='KeyD') keys.right = false; if (e.code==='Space' || e.code==='ArrowUp' || e.code==='KeyW') keys.up = false; });
  // Mobile controls (basic)
  function setupTouchControls(){ const leftBtn=document.getElementById('leftBtn'), rightBtn=document.getElementById('rightBtn'), jumpBtn=document.getElementById('jumpBtn'); if (leftBtn){ leftBtn.addEventListener('mousedown', ()=>{ keys.left=true; }); leftBtn.addEventListener('mouseup', ()=>{ keys.left=false; }); leftBtn.addEventListener('touchstart', ()=>{ keys.left=true; }); leftBtn.addEventListener('touchend', ()=>{ keys.left=false; }); } if (rightBtn){ rightBtn.addEventListener('mousedown', ()=>{ keys.right=true; }); rightBtn.addEventListener('mouseup', ()=>{ keys.right=false; }); rightBtn.addEventListener('touchstart', ()=>{ keys.right=true; }); rightBtn.addEventListener('touchend', ()=>{ keys.right=false; }); } if (jumpBtn){ jumpBtn.addEventListener('mousedown', ()=>{ keys.up=true; }); jumpBtn.addEventListener('mouseup', ()=>{ keys.up=false; }); jumpBtn.addEventListener('touchstart', ()=>{ keys.up=true; }); jumpBtn.addEventListener('touchend', ()=>{ keys.up=false; }); } }
  setupTouchControls();

  // Level data
  function loadLevel(index){ currentLevel = Math.max(0, Math.min(index, levels.length-1)); const L = levels[currentLevel]; worldWidth = L.width; worldHeight = L.height; platforms = L.platforms.map(p => ({...p})); endZone = L.endZone ? {...L.endZone} : null; enemies = L.enemies.map(e => ({ x:e.x, y:e.y, w:e.w, h:e.h, minX:e.minX, maxX:e.maxX, speed:e.speed, dir: 1 })); coins = L.coins.map(c => ({...c})); coinsCollected = 0; score = 0; player.x = 60; player.y = 0; player.vx = 0; player.vy = 0; player.alive = true; player.onGround = false; trails.length = 0; particles.length = 0; camShake = 0; camX = 0; updateHUD(); }
  const levels = [ { name:'Sunrise', width:4200, height:600, platforms:[{x:0,y:520,w:1800,h:40},{x:1200,y:420,w:600,h:40},{x:2100,y:360,w:500,h:40},{x:2700,y:500,w:400,h:40},{x:3600,y:480,w:600,h:40}], endZone:{x:3950,y:520,w:60,h:60}, enemies:[{x:800,y:500,w:34,h:34,minX:700,maxX:1100,speed:60}], coins:[{x:650,y:480,r:8,collected:false},{x:1500,y:420,r:8,collected:false},{x:2300,y:320,r:8,collected:false}] }, { name:'Midnight', width:5400, height:600, platforms:[{x:0,y:520,w:2000,h:40},{x:1800,y:420,w:240,h:40},{x:2100,y:360,w:260,h:40},{x:2400,y:420,w:400,h:40},{x:3100,y:520,w:2000,h:40},{x:4100,y:460,w:280,h:40}], endZone:{x:5150,y:520,w:60,h:60}, enemies:[{x:1500,y:500,w:34,h:34,minX:1400,maxX:1700,speed:80},{x:3200,y:480,w:34,h:34,minX:3000,maxX:3600,speed:60}], coins:[{x:420,y:490,r:8,collected:false},{x:1500,y:480,r:8,collected:false},{x:3200,y:450,r:8,collected:false}] }, { name:'Nebula', width:6400, height:600, platforms:[{x:0,y:520,w:2500,h:40},{x:2600,y:470,w:300,h:40},{x:3000,y:420,w:300,h:40},{x:3500,y:470,w:350,h:40},{x:4200,y:520,w:1000,h:40},{x:5200,y:420,w:300,h:40}], endZone:{x:6100,y:520,w:60,h:60}, enemies:[{x:500,y:500,w:34,h:34,minX:100,maxX:900,speed:90},{x:4600,y:500,w:34,h:34,minX:4400,maxX:5200,speed:70}], coins:[{x:600,y:480,r:8,collected:false},{x:5200,y:460,r:8,collected:false}] } ];
  let currentLevel = 0; let worldWidth = 0; let worldHeight = 0; let platforms = []; let enemies = []; let coins = []; let endZone = null;
  const player = { x: 60, y: 0, vx: 0, vy: 0, r: 22, onGround: false, alive: true };
  const trails = []; const particles = [];
  let score = 0; let coinsCollected = 0;

  // UI hooks
  const overlay = document.getElementById('overlay'); const startPanel = document.getElementById('startPanel'); const deathPanel = document.getElementById('deathPanel'); const levelCompletePanel = document.getElementById('levelCompletePanel'); const pausePanel = document.getElementById('pausePanel'); const levelSelectPanel = document.getElementById('levelSelectPanel'); const levelGridEl = document.getElementById('levelGrid');
  function showOverlay(panel){ overlay.style.display = ''; startPanel.style.display = 'none'; deathPanel.style.display = 'none'; levelCompletePanel.style.display = 'none'; pausePanel.style.display = 'none'; levelSelectPanel.style.display = 'none'; settingsPanel.style.display = 'none'; if(panel) panel.style.display=''; }
  function hideOverlay(){ overlay.style.display = 'none'; }

  // Level grid
  function populateLevelSelect(){ levelGridEl.innerHTML = ''; for(let i=0;i<levels.length;i++){ const unlocked = i <= (parseInt(localStorage.getItem('levelUnlocked')||'0',10)); const btn = document.createElement('div'); btn.className = 'levelBtn' + (unlocked?'':' locked'); btn.textContent = (i+1); btn.style.opacity = unlocked? '1':'0.4'; btn.style.pointerEvents = unlocked? 'auto':'none'; btn.onclick = ()=>{ hideOverlay(); loadLevel(i); requestAnimationFrame(loop); updateHUD(); }; levelGridEl.appendChild(btn); } }

  // Physics helpers
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function circleRectCollision(cx, cy, r, rx, ry, rw, rh){ const closestX = clamp(cx, rx, rx+rw); const closestY = clamp(cy, ry, ry+rh); const dx = cx - closestX, dy = cy - closestY; return (dx*dx + dy*dy) <= (r*r); }

  // Coin interactions
  function checkCoinCollisions(){ for(let i=coins.length-1;i>=0;i--){ const c = coins[i]; if(c.collected) continue; if(circleRectCollision(player.x, player.y, player.r, c.x - c.r, c.y - c.r, c.r*2, c.r*2)){ c.collected = true; coinsCollected++; score += 50; spawnFloating(player.x, player.y-20, '+50', '#ffd700'); if (sfxOn) playCoinSound(); } } }
  // Floating text
  function spawnFloating(x,y,text,color='#ffd166'){ const el = document.createElement('div'); el.className = 'floating'; el.style.left = x+'px'; el.style.top = y+'px'; el.textContent = text; el.style.color = color; document.body.appendChild(el); setTimeout(()=>{ el.remove(); }, 1100); }
  // Death particles
  function spawnDeathParticles(px, py){ for(let i=0;i<40;i++){ const a = Math.random()*Math.PI*2; const s = 60 + Math.random()*180; particles.push({ x:px, y:py, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:1.2 + Math.random()*0.6, color:'orange'}); } }
  function updateParticles(dt){ for(let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.life -= dt; if(p.life<=0){ particles.splice(i,1); continue; } p.vy += 300*dt; p.x += p.vx*dt; p.y += p.vy*dt; } }

  // Death / level complete
  function die(){ if(!player.alive) return; player.alive = false; player.vx = 0; player.vy = 0; camShake = 12; spawnDeathParticles(player.x, player.y); setTimeout(()=>{ showOverlay(deathPanel); }, 250); playDeathSound(); }
  function onLevelComplete(){ showOverlay(levelCompletePanel); const next = currentLevel+1; const unlocked = parseInt(localStorage.getItem('levelUnlocked')||'0',10); if(next>unlocked) localStorage.setItem('levelUnlocked', String(next)); // stars
    const starsEl = document.getElementById('stars'); starsEl.innerHTML = ''; const stars = Math.min(3, Math.floor(score/150) + (coinsCollected>=3?1:0)); for(let s=0;s<3;s++){ const sp = document.createElement('span'); sp.textContent = '★'; sp.style.color = s<stars ? '#ffd700' : '#555'; sp.style.fontSize = '20px'; sp.style.marginRight = '6px'; starsEl.appendChild(sp); }
  }

  // Rendering
  function drawParallaxBackground(){ // simple gradient + stars
    const g = ctx.createLinearGradient(0,0, worldWidth, worldHeight); g.addColorStop(0, '#0a0a1a'); g.addColorStop(1, '#050518'); ctx.fillStyle = g; ctx.fillRect(0,0, worldWidth, worldHeight); ctx.fillStyle = '#1e1e1e'; for(let i=-200;i<worldWidth;i+=250){ const x = i - ((camX*0.25)%250); ctx.beginPath(); ctx.moveTo(x, 260); ctx.lineTo(x+120, 120); ctx.lineTo(x+240, 260); ctx.closePath(); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,.05)'; for(let s=0;s<80;s++){ const ox = ((s*97)%worldWidth) - camX; const oy = (s*53)%worldHeight; if(ox<0||ox>worldWidth) continue; ctx.fillRect(ox, oy, 2, 2); } }
  function renderWorld(){ ctx.clearRect(0,0,W,H); ctx.save(); const shakeX = camShake * (Math.random()*2-1); ctx.translate(-camX + shakeX, 0); drawParallaxBackground(); // Platforms
    ctx.fillStyle = '#7a4a2f'; for(const p of platforms) ctx.fillRect(p.x, p.y, p.w, p.h); // End zone
    if(endZone){ ctx.fillStyle = 'rgba(0,200,0,.6)'; ctx.fillRect(endZone.x, endZone.y, endZone.w, endZone.h); }
    // Coins
    for(const c of coins) if(!c.collected){ ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(c.x-1, c.y - c.r - 3, 2, 3); }
    // Enemies
    for(const e of enemies){ ctx.fillStyle = '#e23c3c'; ctx.fillRect(e.x, e.y, e.w, e.h); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(e.x, e.y + e.h, e.w, 6); }
    // Player glow
    const glow = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, player.r*1.5); glow.addColorStop(0,'rgba(255,255,255,.9)'); glow.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill(); // Trails
    if (trails.length && trailsEnabled){ for(let i=0;i<trails.length;i++){ const t = trails[i]; const a = (i/trails.length)*0.6; ctx.fillStyle = `rgba(0, 180, 255, ${a})`; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.fill(); } }
    // Player
    ctx.fillStyle = player.alive ? '#fff' : '#888'; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill(); // Particles
    ctx.globalAlpha = 1; for(const p of particles){ ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life); ctx.fillRect(p.x, p.y, 2, 2); ctx.globalAlpha = 1; }
    ctx.restore(); if(inTransition){ ctx.save(); ctx.globalAlpha = transitionAlpha; ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H); ctx.restore(); }
  }

  // Camera
  function updateCamera(){ camX = player.x - W*0.5; camX = Math.max(0, Math.min(camX, worldWidth - W)); camShake *= 0.92; if (camShake < 0.01) camShake = 0; }

  // Init / loop
  let lastTime = performance.now(); let startedNow = false; let inTransition = true; let transitionAlpha = 1;
  function init(){ loadLevel(0); started = false; showOverlay(startPanel); // allow user to start
    // button bindings
    startBtn.onclick = ()=>{ hideOverlay(); started = true; lastTime = performance.now(); requestAnimationFrame(loop); };
    levelSelectBtn.onclick = ()=>{ populateLevelSelect(); showOverlay(levelSelectPanel); };
    restartBtn.onclick = ()=>{ hideOverlay(); loadLevel(currentLevel); requestAnimationFrame(loop); };
    levelSelectFromDeathBtn.onclick = ()=>{ populateLevelSelect(); showOverlay(levelSelectPanel); };
    continueBtn.onclick = ()=>{ hideOverlay(); const next = currentLevel+1; if(next<levels.length) loadLevel(next); else loadLevel(0); requestAnimationFrame(loop); };
    levelSelectFromCompleteBtn.onclick = ()=>{ populateLevelSelect(); showOverlay(levelSelectPanel); };
    resumeBtn.onclick = ()=>{ paused = false; hideOverlay(); lastTime = performance.now(); requestAnimationFrame(loop); };
    levelSelectFromPauseBtn.onclick = ()=>{ populateLevelSelect(); showOverlay(levelSelectPanel); };
    backFromLevelSelect.onclick = ()=>{ hideOverlay(); };
    gravSlider.oninput = ()=>{ gravity = parseFloat(gravSlider.value); gravVal.textContent = gravSlider.value; };
    jumpSlider.oninput = ()=>{ JUMP_VY = parseFloat(jumpSlider.value); jumpVal.textContent = jumpSlider.value; };
    fricSlider.oninput = ()=>{ friction = parseFloat(fricSlider.value); fricVal.textContent = fricSlider.value; };
    trailToggle.onclick = ()=>{ trailsEnabled = !trailsEnabled; trailToggle.textContent = trailsEnabled ? 'On':'Off'; localStorage.setItem('trailEnabled', String(trailsEnabled)); };
    musicToggle.onclick = ()=>{ sfxOn = !sfxOn; musicToggle.textContent = 'Music ' + (sfxOn ? 'On':'Off'); };
    sfxToggle.onclick = ()=>{ sfxOn = !sfxOn; sfxToggle.textContent = 'SFX ' + (sfxOn ? 'On':'Off'); };
    closeSettings.onclick = ()=>{ hideOverlay(); };
  }

  function loadLevelData(index){ currentLevel = Math.max(0, Math.min(index, levels.length-1)); const L = levels[currentLevel]; worldWidth = L.width; worldHeight = L.height; platforms = L.platforms.map(p => ({...p})); endZone = L.endZone ? {...L.endZone} : null; enemies = L.enemies.map(e => ({ x:e.x, y:e.y, w:e.w, h:e.h, minX:e.minX, maxX:e.maxX, speed:e.speed, dir:1 })); coins = L.coins.map(c => ({...c})); coinsCollected = 0; score = 0; player.x = 60; player.y = 0; player.vx = 0; player.vy = 0; player.alive = true; player.onGround = false; trails.length = 0; particles.length = 0; camShake = 0; camX = 0; updateHUD(); }
  function loadLevel(index){ loadLevelData(index); }

  // Level actions
  function loop(now){ if(!started){ return; } const dt = Math.min(0.033, (now - lastTime) / 1000); lastTime = now; if(!paused){ // Transition
      if (inTransition){ transitionAlpha -= dt * 1.6; if (transitionAlpha <= 0){ transitionAlpha = 0; inTransition = false; } }
      // Movement input
      let ax = 0; if (keys.left) ax -= 1; if (keys.right) ax += 1; // simple acceleration
      player.vx += ax * 800 * dt; if (player.onGround && Math.abs(player.vx) < 1) player.vx = 0; if (player.onGround) player.vx *= friction; player.vx = clamp(player.vx, -MAXVX, MAXVX);
      // Jumping
      if ((keys.up) && player.onGround && player.alive){ player.vy = JUMP_VY; player.onGround = false; if (sfxOn) playJumpTone(); }
      // Gravity / integrate
      player.vy += gravity * dt; let nx = player.x + player.vx * dt; let ny = player.y + player.vy * dt; // collisions with platforms (circle-rect)
      let onGround = false; for(const p of platforms){ if(circleRectCollision(nx, ny, player.r, p.x, p.y, p.w, p.h)){ // resolve
          const closestX = Math.max(p.x, Math.min(nx, p.x + p.w)); const closestY = Math.max(p.y, Math.min(ny, p.y + p.h)); const dx = nx - closestX; const dy = ny - closestY; const dist = Math.max(1e-4, Math.hypot(dx, dy)); const nxp = dx / dist, nyp = dy / dist; const penetration = player.r - dist; nx += nxp * penetration; ny += nyp * penetration; if (nyp > 0) onGround = true; } }
      if (nx < player.r) { nx = player.r; player.vx = 0; } if (ny > worldHeight - player.r) { ny = worldHeight - player.r; player.vy = 0; player.onGround = true; }
      player.x = nx; player.y = ny; player.onGround = onGround;
      // Enemies
      for(let e of enemies){ e.x += e.dir * e.speed * dt; if (e.x < e.minX){ e.x = e.minX; e.dir = 1; } if (e.x > e.maxX){ e.x = e.maxX; e.dir = -1; } if(circleRectCollision(player.x, player.y, player.r, e.x, e.y, e.w, e.h)){ die(); } }
      // End / coins
      if(endZone && circleRectCollision(player.x, player.y, player.r, endZone.x, endZone.y, endZone.w, endZone.h)){ onLevelComplete(); }
      checkCoinCollisions();
      // Trails
      if (trailsEnabled){ trails.unshift({ x: player.x, y: player.y, r: Math.max(6, player.r*0.6) }); if (trails.length > 60) trails.pop(); }
      // Camera
      camX = player.x - W*0.5; camX = Math.max(0, Math.min(camX, worldWidth - W)); camShake *= 0.92; if (camShake < 0.01) camShake = 0; updateParticles(dt);
    }
    renderWorld(); requestAnimationFrame(loop);
  }

  function dieReset(){ // helper to end game gracefully
    player.alive = false; player.vx = 0; player.vy = 0; camShake = 12; spawnDeathParticles(player.x, player.y); setTimeout(()=>{ showOverlay(deathPanel); }, 250); playDeathSound(); }

  function renderWorld(){ ctx.clearRect(0,0,W,H); ctx.save(); const shakeX = camShake * (Math.random()*2 - 1); ctx.translate(-camX + shakeX, 0); drawParallaxBackground(); ctx.fillStyle = '#7a4a2f'; for(const p of platforms) ctx.fillRect(p.x, p.y, p.w, p.h); if(endZone){ ctx.fillStyle = 'rgba(0,200,0,.6)'; ctx.fillRect(endZone.x, endZone.y, endZone.w, endZone.h); } for(const c of coins){ if(!c.collected){ ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(c.x-1, c.y - c.r - 3, 2, 3); } } for(const e of enemies){ ctx.fillStyle = '#e23c3c'; ctx.fillRect(e.x, e.y, e.w, e.h); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(e.x, e.y + e.h, e.w, 6); } // glow
    const glow = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, player.r*1.5); glow.addColorStop(0,'rgba(255,255,255,.9)'); glow.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill(); // trails
    if (trails.length && trailsEnabled){ for(let i=0;i<trails.length;i++){ const t = trails[i]; const a = (i/trails.length)*0.6; ctx.fillStyle = `rgba(0, 180, 255, ${a})`; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.fill(); } }
    // player
    ctx.fillStyle = player.alive ? '#fff' : '#888'; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill(); // particles
    for(const p of particles){ ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life); ctx.fillRect(p.x, p.y, 2, 2); ctx.globalAlpha = 1; }
    ctx.restore(); if(inTransition){ ctx.save(); ctx.globalAlpha = transitionAlpha; ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H); ctx.restore(); }
  }

  function drawParallaxBackground(){ const g = ctx.createLinearGradient(0,0, worldWidth, worldHeight); g.addColorStop(0,'#0a0a1a'); g.addColorStop(1,'#050518'); ctx.fillStyle = g; ctx.fillRect(0,0, worldWidth, worldHeight); ctx.fillStyle = '#1e1e1e'; for(let i=-200;i<worldWidth;i+=250){ const x = i - ((camX*0.25)%250); ctx.beginPath(); ctx.moveTo(x, 260); ctx.lineTo(x+120, 120); ctx.lineTo(x+240, 260); ctx.closePath(); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,.05)'; for(let s=0;s<80;s++){ const ox = ((s*97)%worldWidth) - camX; const oy = (s*53)%worldHeight; if(ox<0||ox>worldWidth) continue; ctx.fillRect(ox, oy, 2, 2); } }

  // Init
  function initProgress(){ if(localStorage.getItem('levelUnlocked')===null) localStorage.setItem('levelUnlocked','0'); if(localStorage.getItem('bestScore')===null) localStorage.setItem('bestScore','0'); if(localStorage.getItem('trailEnabled')!==null) trailsEnabled = (localStorage.getItem('trailEnabled')==='true'); }
  function init(){ initProgress(); loadLevel(0); showOverlay(startPanel); // bind level select grid
    populateLevelSelect(); // reuse
    // HUD
    updateHUD(); }

  // Input: keyboard pause
  document.addEventListener('keydown', (e)=>{ if (e.code==='KeyP' || e.code==='Escape'){ if(!started) return; togglePause(); } });
  function togglePause(){ if(!paused){ paused = true; showOverlay(pausePanel); } else { paused = false; hideOverlay(); lastTime = performance.now(); requestAnimationFrame(loop); } }

  // Bind level complete / death actions
  function onLevelLost(){ die(); }

  // Death/coin particle functions
  function die(){ if(!player.alive) return; player.alive = false; camShake = 12; spawnDeathParticles(player.x, player.y); setTimeout(()=>{ showOverlay(deathPanel); }, 250); playDeathSound(); }

  function spawnDeathParticles(px, py){ for(let i=0;i<40;i++){ const a = Math.random()*Math.PI*2; const s = 60 + Math.random()*180; particles.push({ x: px, y: py, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 1.2 + Math.random()*0.6, color: 'orange' }); } }
  function updateHUDPersistent(){ const best = parseInt(localStorage.getItem('bestScore') || '0', 10); const hud = document.getElementById('hudBest'); hud.textContent = 'Best: ' + best; }

  // Start game loop once user clicks Play
  init();
  // StartLoop will run after start button is pressed; ensure we guard against auto-run
  let lastTime = performance.now();
  function loopRunner(now){ lastTime = now; loop(now); }
  function loop(now){ if(!started) return; const dt = Math.min(0.033, (now - lastTime) / 1000); lastTime = now; if(!paused){ if (inTransition){ transitionAlpha -= dt * 1.6; if (transitionAlpha <= 0){ transitionAlpha = 0; inTransition = false; } } // player physics
      let ax = 0; if (keys.left) ax -= 1; if (keys.right) ax += 1; player.vx += ax * 800 * dt; if (player.onGround && Math.abs(player.vx) < 1) player.vx = 0; if (player.onGround) player.vx *= friction; const MAXVX = 260; player.vx = clamp(player.vx, -MAXVX, MAXVX);
      if (keys.up && player.onGround && player.alive){ player.vy = JUMP_VY; player.onGround = false; if (sfxOn) playJumpTone(); }
      player.vy += gravity * dt; let nx = player.x + player.vx * dt; let ny = player.y + player.vy * dt; let onGround = false; for(const p of platforms){ if(circleRectCollision(nx, ny, player.r, p.x, p.y, p.w, p.h)){ const closestX = Math.max(p.x, Math.min(nx, p.x+p.w)); const closestY = Math.max(p.y, Math.min(ny, p.y+p.h)); const dx = nx - closestX; const dy = ny - closestY; const dist = Math.max(1e-4, Math.hypot(dx, dy)); const nxp = dx / dist, nyp = dy / dist; const penetration = player.r - dist; nx += nxp * penetration; ny += nyp * penetration; if(nyp > 0) onGround = true; } }
      if (nx < player.r){ nx = player.r; player.vx = 0; } if (ny > worldHeight - player.r){ ny = worldHeight - player.r; player.vy = 0; player.onGround = true; }
      player.x = nx; player.y = ny; player.onGround = onGround; // Enemies
      for(let ei=0; ei<enemies.length; ei++){ const e = enemies[ei]; e.x += e.dir * e.speed * dt; if (e.x < e.minX){ e.x = e.minX; e.dir = 1; } if (e.x > e.maxX){ e.x = e.maxX; e.dir = -1; } if(circleRectCollision(player.x, player.y, player.r, e.x, e.y, e.w, e.h)){ die(); } }
      if(endZone && circleRectCollision(player.x, player.y, player.r, endZone.x, endZone.y, endZone.w, endZone.h)){ onLevelComplete(); }
      checkCoinCollisions(); if (trailsEnabled){ trails.unshift({ x: player.x, y: player.y, r: Math.max(6, player.r * 0.6) }); if (trails.length > 60) trails.pop(); } camX = player.x - W*0.5; camX = Math.max(0, Math.min(camX, worldWidth - W)); camShake *= 0.92; if (camShake < 0.01) camShake = 0; updateParticles(dt); }
    renderWorld(); requestAnimationFrame(loop); }

  // Start button wiring (ensure elements exist)
  // If not started, the main loop is paused by overlay; we kick off after start button manually
})();
