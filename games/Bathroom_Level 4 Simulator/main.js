(function(){
  // Bathroom Level 4 Simulator - core loop with a data-driven toilet mechanics subsystem
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  let W = 800, H = 450; // CSS pixels
  let paused = false;

  // Options (reflecting Level-4 feature targets)
  const opt = {
    ripple: true,
    glow: true,
    bubbles: true,
    parallax: true
  };

  // UI elements (existing IDs from index.html)
  const optRipple = document.getElementById('opt-ripple');
  const optGlow = document.getElementById('opt-glow');
  const optBubbles = document.getElementById('opt-bubbles');
  const optParallax = document.getElementById('opt-parallax');
  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');

  // Difficulty and accessibility controls (Level-4 targets)
  const diffSlider = document.getElementById('slider-difficulty');
  const diffVal = document.getElementById('diff-val');
  const optColorblind = document.getElementById('opt-colorblind');
  const optUiScale = document.getElementById('opt-ui-scale');

  // Faucet placeholder (for visuals)
  const faucet = { x: 180, y: 120, w: 60, h: 40 };

  // Internal state
  let difficulty = 4; // default level-4 difficulty
  let last = performance.now();

  // Simple particles for visuals
  const drips = [];
  const bubbles = [];
  const ripples = [];

  function rand(a,b){ return a + Math.random()*(b-a); }

  // Difficulty-aware data-driven toilet mechanics subsystem (Level-4 focused)
  class ToiletMechanics {
    constructor(difficulty){
      this.difficulty = difficulty;
      this.state = 'idle'; // idle|filling|flushing|draining|overflow
      this.cycleTime = 0;
      // Tank and flow parameters (adjusted by difficulty)
      this.tank = { level: 70, capacity: 100, fillRate: 6 + difficulty*2.0 }; // units per second
      this.clog = { active: false, level: 0, severity: 0 }; // clog state
      this.overflow = false;
      this.waterUsed = 0; // cumulative water usage metric
      this.pendingFlush = false; // user-initiated flush trigger flag
    }
    update(dt){
      // Random, level-4-appropriate clog emergence
      if (!this.clog.active && Math.random() < 0.0015 * (this.difficulty/4)){
        this.clog.active = true; this.clog.level = 0.25; this.clog.severity = 0.2;
      }
      // If a clog is active, it slowly worsens unless user unclogs
      if (this.clog.active){ this.clog.severity = Math.min(1, this.clog.severity + 0.05*dt); }

      switch(this.state){
        case 'idle':
          // Auto-fill slowly to simulate baseline water usage; Level-4 narrows tolerances by increasing fill/sense
          this.tank.level = Math.min(this.tank.capacity, this.tank.level + this.tank.fillRate * dt * 0.2);
          this.waterUsed += this.tank.fillRate * dt * 0.2;
          // If a flush button was pressed recently, handle in separate flag
          if (this.pendingFlush){ this.state = 'flushing'; this.cycleTime = 0; this.pendingFlush = false; }
          break;
        case 'filling':
          this.tank.level = Math.min(this.tank.capacity, this.tank.level + this.tank.fillRate * dt);
          this.waterUsed += this.tank.fillRate * dt;
          if (this.tank.level >= this.tank.capacity){ this.tank.level = this.tank.capacity; this.state = 'overflow'; this.overflow = true; }
          break;
        case 'flushing':
          // Flush cycle: rapid drain from tank, with higher effort at higher difficulty
          const drainRate = Math.max(40, 60 + this.difficulty * 20);
          this.tank.level = Math.max(0, this.tank.level - drainRate * dt);
          this.cycleTime += dt;
          this.waterUsed += drainRate * dt * 0.3;
          if (this.tank.level <= 0){ this.tank.level = 0; this.state = 'draining'; this.cycleTime = 0; }
          break;
        case 'draining':
          // Short settling period after flush
          this.cycleTime += dt;
          if (this.cycleTime > 0.6){ this.state = 'idle'; this.cycleTime = 0; }
          break;
        case 'overflow':
          // Remain overflowed until reset or unclog resolves
          this.cycleTime += dt;
          // Quick auto-resolve after some time if not clogged
          if (this.tank.level <= 0.7 * this.tank.capacity){ this.overflow = false; }
          if (this.cycleTime > 2.0){ this.state = 'idle'; this.cycleTime = 0; this.overflow = false; }
          break;
      }
    }
    triggerFlush(){
      if (this.state === 'idle' || this.state === 'filling' || this.state === 'overflow'){
        this.pendingFlush = true;
      }
    }
    unclogAttempt(){
      if (!this.clog.active) return;
      // Simulated unclog action reduces clog severity; if fully resolved, deactivate
      this.clog.level = Math.max(0, this.clog.level - 0.25);
      if (this.clog.level <= 0){ this.clog.active = false; this.clog.severity = 0; }
    }
    getStatus(){
      return {
        state: this.state,
        tankLevel: this.tank.level,
        capacity: this.tank.capacity,
        clogged: this.clog.active,
        clogLevel: this.clog.level,
        overflow: this.overflow
      };
    }
  }

  // Telemetry for real-time feedback (Level-4 readiness)
  class Telemetry {
    constructor(){ this.totalTime = 0; this.waterUsed = 0; this.cycles = 0; this.score = 0; }
    update(dt, status){ this.totalTime += dt; this.waterUsed = (this.waterUsed || 0) + (status?.tankLevel ? 0 : 0); // placeholder; actual value tracked in ToiletMechanics
      // Basic scoring heuristic: each flush cycle increases score when overflow avoided; keep simple for now
      if (status && status.state === 'idle' && this.totalTime > 0) { /* no-op here */ }
    }
  }

  // Helpers for basic visuals
  const faucetLines = [];

  function spawnDrip(){ const d = { x: faucet.x + faucet.w/2, y: faucet.y + faucet.h, vy: rand(60,100) }; drips.push(d); }
  function spawnBubble(x,y){ const b = { x, y, r: rand(5,12), vy: rand(-40,-10), vx: rand(-20,20), life: rand(0.6,1.2) }; bubbles.push(b); }
  function spawnRipple(x,y){ const r = { x, y, radius: 2, life: 0.8 }; ripples.push(r); }

  // Init instances
  let toilet = new ToiletMechanics(difficulty);
  let telemetry = new Telemetry();

  // Canvas resize handling
  function resize(){
    const cssW = Math.max(400, canvas.clientWidth || 800);
    const cssH = Math.max(300, canvas.clientHeight || 450);
    DPR = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(cssW * DPR);
    canvas.height = Math.floor(cssH * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
    W = cssW; H = cssH;
  }
  window.addEventListener('resize', resize);
  resize();

  // Basic drawing helpers
  function drawTiles(offset){ const tile = 22; ctx.save(); ctx.fillStyle = '#0a2b44'; ctx.fillRect(0,0,W,120); for(let y=0;y<4;y++){ for(let x=0;x<Math.ceil(W/tile);x++){ const r = (x*tile + y*tile*0.5 + offset)%60; ctx.fillStyle = (r<30) ? '#0b4d6e':'#0c5f88'; ctx.fillRect(x*tile, y*tile, tile-2, tile-2); } } ctx.restore(); }
  function drawMirror(){ const mx = W - 240; const my = 40; ctx.save(); ctx.fillStyle = '#d9d9d9'; ctx.fillRect(mx, my, 180, 160); const grad = ctx.createLinearGradient(mx+5, my+5, mx+175, my+165); grad.addColorStop(0, 'rgba(0,0,0,0.15)'); grad.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = grad; ctx.fillRect(mx+4, my+4, 172, 152); ctx.globalAlpha = 0.5; ctx.fillStyle = '#6bd0ff'; ctx.fillRect(140, 150, 60, 10); ctx.globalAlpha = 1.0; ctx.restore(); }
  function drawSinkAndFaucet(){ ctx.save(); ctx.fillStyle = '#2b3c57'; const sinkX = 40; const sinkY = H-110; ctx.fillRect(sinkX, sinkY, 240, 60); ctx.fillStyle = '#21405d'; ctx.beginPath(); ctx.ellipse(sinkX+60, sinkY+12, 60, 20, 0, Math.PI, 0, true); ctx.fill(); ctx.fillStyle = '#b0b0b0'; ctx.fillRect(faucet.x, faucet.y, faucet.w, 6); ctx.fillRect(faucet.x+20, faucet.y-18, 60, 8); ctx.fillRect(faucet.x-6, faucet.y-6, 12, 12); ctx.restore(); }

  // Rendering of HUD overlays for Level-4 feedback
  function renderHUD(status){
    ctx.fillStyle = '#e8f0ff'; ctx.font = '12px monospace';
    // Tank and status bars
    const barX = 8, barY = 8, barW = 240, barH = 14;
    ctx.fillStyle = '#2a2f38'; ctx.fillRect(barX, barY, barW, barH); const pct = Math.max(0, Math.min(1, status.tankLevel / status.capacity)); ctx.fillStyle = status.overflow ? '#ff4d4d' : '#4bd389'; ctx.fillRect(barX, barY, barW*pct, barH);
    ctx.strokeStyle = '#000'; ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#ffffff'; ctx.fillText('Tank Level: ' + Math.round(status.tankLevel) + ' / ' + status.capacity, barX + barW + 8, barY + barH - 2);

    // Clog status
    ctx.fillStyle = '#e8f0ff'; ctx.fillText('Clog: ' + (status.clogged ? 'Yes' : 'No'), barX, barY + barH + 16);
    if (status.clogged){ ctx.fillStyle = '#ffd27a'; ctx.fillText('Clog severity: ' + Math.round(status.clogLevel*100) + '%', barX, barY + barH + 32); }

    // Overflow indicator
    if (status.overflow){ ctx.fillStyle = '#ffaaaa'; ctx.fillText('Overflow active!', barX, barY + barH + 48); }

    // Difficulty and time
    ctx.fillStyle = '#e8f0ff'; ctx.fillText('Difficulty: ' + difficulty, 8, H - 8);
  }

  // Core render loop helpers
  function render(){
    ctx.clearRect(0,0,W,H);
    // Background
    const sky = ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0, opt.glow ? '#a8e0ff' : '#4a6d8c');
    sky.addColorStop(1, '#101018');
    ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

    // Floor tiles if parallax is on
    if (opt.parallax){ const t = (Date.now()/1000)%40; ctx.save(); ctx.translate(0, H-120); drawTiles(t); ctx.restore(); } else { ctx.save(); ctx.translate(0, H-120); drawTiles(0); ctx.restore(); }

    drawMirror();
    drawSinkAndFaucet();

    // Visual water elements
    const status = toilet.getStatus();
    // Tank meter HUD
    renderHUD(status);

    // Drips, bubbles, ripples (cosmetic water visuals)
    ctx.lineWidth = 2; ctx.strokeStyle = '#99d6ff';
    for(let d of drips){ ctx.beginPath(); ctx.moveTo(d.x, faucet.y + faucet.h - 5); ctx.lineTo(d.x, d.y); ctx.stroke(); ctx.fillStyle = '#aee'; ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, Math.PI*2); ctx.fill(); }
    for(let i=ripples.length-1;i>=0;i--){ const r=ripples[i]; ctx.strokeStyle = 'rgba(180,230,255,'+r.life+')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI*2); ctx.stroke(); }
    for(let b of bubbles){ ctx.fillStyle = 'rgba(180,240,255,0.9)'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(b.x - b.r/2, b.y - b.r/2, b.r/3, 0, Math.PI*2); ctx.fill(); }

  }

  function drawTiles(offset){ const tile = 22; ctx.save(); ctx.fillStyle = '#0a2b44'; ctx.fillRect(0,0,W,120); for(let y=0;y<4;y++){ for(let x=0;x<Math.ceil(W/tile);x++){ const r = (x*tile + y*tile*0.5 + offset)%60; ctx.fillStyle = (r<30) ? '#0b4d6e':'#0c5f88'; ctx.fillRect(x*tile, y*tile, tile-2, tile-2); } } ctx.restore(); }
  function drawMirror(){ const mx = W - 240; const my = 40; ctx.save(); ctx.fillStyle = '#d9d9d9'; ctx.fillRect(mx, my, 180, 160); const grad = ctx.createLinearGradient(mx+5, my+5, mx+175, my+165); grad.addColorStop(0, 'rgba(0,0,0,0.15)'); grad.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = grad; ctx.fillRect(mx+4, my+4, 172, 152); ctx.globalAlpha = 0.5; ctx.fillStyle = '#6bd0ff'; ctx.fillRect(140, 150, 60, 10); ctx.globalAlpha = 1.0; ctx.restore(); }
  function drawSinkAndFaucet(){ ctx.save(); ctx.fillStyle = '#2b3c57'; const sinkX = 40; const sinkY = H-110; ctx.fillRect(sinkX, sinkY, 240, 60); ctx.fillStyle = '#21405d'; ctx.beginPath(); ctx.ellipse(sinkX+60, sinkY+12, 60, 20, 0, Math.PI, 0, true); ctx.fill(); ctx.fillStyle = '#b0b0b0'; ctx.fillRect(faucet.x, faucet.y, faucet.w, 6); ctx.fillRect(faucet.x+20, faucet.y-18, 60, 8); ctx.fillRect(faucet.x-6, faucet.y-6, 12, 12); ctx.restore(); }

  // UI control sync (difficulty + accessibility toggles)
  function syncOptions(){ opt.ripple = optRipple && optRipple.checked; opt.glow = optGlow && optGlow.checked; opt.bubbles = optBubbles && optBubbles.checked; opt.parallax = optParallax && optParallax.checked; }

  // Interaction handlers
  canvas.addEventListener('click', (e)=>{ const rect = canvas.getBoundingClientRect(); const x = e.clientX - rect.left; const y = e.clientY - rect.top; spawnRipple(x, y); if(opt.bubbles) for(let i=0;i<5;i++) spawnBubble(x + Math.random()*20 - 10, y + Math.random()*20 - 10); toilet.triggerFlush(); });

  window.addEventListener('keydown', (ev)=>{ const k = ev.key.toLowerCase(); if (k === 'f') { toilet.triggerFlush(); } else if (k === 'u') { toilet.unclogAttempt(); } else if (k === 'r') { btnReset.click(); } });

  btnPause.addEventListener('click', ()=>{ paused = !paused; btnPause.textContent = paused ? 'Resume' : 'Pause'; });
  btnReset.addEventListener('click', ()=>{ drips.length = 0; bubbles.length = 0; ripples.length = 0; paused = false; toilet = new ToiletMechanics(difficulty); btnPause.textContent = 'Pause'; });

  // Save/Load (basic localStorage integration for progression)
  function saveProgress(){ const data = { difficulty, toilet: toilet.getStatus(), last: last }; localStorage.setItem('bathroom_lvl4_save', JSON.stringify(data)); }
  function loadProgress(){ const s = localStorage.getItem('bathroom_lvl4_save'); if (s){ try { const d = JSON.parse(s); difficulty = d.difficulty || 4; toilet = new ToiletMechanics(difficulty); Object.assign(toilet, d.toilet || {}); } catch(e){} } }

  // Kick off
  readDifficulty();
  function readDifficulty(){ if (diffSlider){ const v = parseInt(diffSlider.value); difficulty = isNaN(v) ? 4 : v; if (diffVal) diffVal.textContent = difficulty; } }

  // Main loop
  function loop(t){ const dt = Math.min(0.033, (t - last)/1000); last = t; if(!paused){ // update subsystems
      toilet.update(dt);
    }
    // Telemetry update (optional deep-dive can be added later)
    render();
    requestAnimationFrame(loop);
  }
  // Initialize and start
  // wire up accessibility and options once DOM is ready
  if (typeof window !== 'undefined'){
    if (optRipple) optRipple.addEventListener('change', ()=>{ syncOptions(); });
    if (optGlow) optGlow.addEventListener('change', ()=>{ syncOptions(); });
    if (optBubbles) optBubbles.addEventListener('change', ()=>{ syncOptions(); });
    if (optParallax) optParallax.addEventListener('change', ()=>{ syncOptions(); });
    if (optColorblind){ optColorblind.addEventListener('change', ()=>{
      // simple accessibility toggle: apply a high-contrast filter when colorblind option is on
      document.body.style.filter = optColorblind.checked ? 'contrast(1.15) saturate(1.15)' : '';
    }); }
    if (optUiScale){ optUiScale.addEventListener('change', ()=>{
      // lightweight UI scale via root font size for CSS-based scaling
      const scale = optUiScale.checked ? 1.15 : 1.0; document.documentElement.style.fontSize = (scale*16|0) + 'px';
    }); }
  }

  // Start loop
  requestAnimationFrame(loop);
})();