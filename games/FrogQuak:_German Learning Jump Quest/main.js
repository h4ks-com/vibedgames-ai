(function(){
  'use strict';
  // Enhanced FrogQuak prototype with input abstraction, data-driven deck, accessibility-friendly prompts,
  // and basic progress persistence. Keeps compatibility with existing HTML structure.

  const canvas = document.getElementById('game');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  // Resize helper to preserve 960x540 vibe
  function resize(){
    if(!canvas || !canvas.getContext) return;
    const w = Math.min(window.innerWidth, 960);
    const h = Math.floor(w * 0.5625);
    canvas.width = w; canvas.height = h;
  }
  window.addEventListener('resize', resize); resize();

  // Input abstraction: keyboard, touch, and gamepad (polled)
  const Input = {
    keys: {},
    jumpQueued: false,
    jumpHeld: false,
    left: false,
    right: false,
    // map actions to codes for multi-input compatibility
    mappings: {
      left: ['ArrowLeft','KeyA'],
      right: ['ArrowRight','KeyD'],
      jump: ['Space','KeyW']
    },
    updateFromKeyEvent(code, isDown){
      this.keys[code] = isDown; 
      // update high-level booleans
      this.left = this.anyKey(this.mappings.left);
      this.right = this.anyKey(this.mappings.right);
      this.jumpHeld = this.anyKey(this.mappings.jump);
      // queue a jump when key pressed
      if(isDown && this.mappings.jump.includes(code)){
        this.jumpQueued = true;
      }
    },
    anyKey(list){ return !!list.find(code => this.keys[code]); },
    isPressed(action){
      if(action==='left') return this.left;
      if(action==='right') return this.right;
      if(action==='jump') return this.jumpQueued;
      return false;
    },
    consumeJump(){ const v = this.jumpQueued; this.jumpQueued = false; return v; },
    // touch jump button hookup
    hookJumpButton(){ const btn = document.getElementById('jumpBtn'); if(!btn) return; btn.addEventListener('pointerdown', ()=>{ this.jumpQueued = true; }); }
  };

  // Initialize keyboard listeners
  window.addEventListener('keydown', (e)=>{ Input.updateFromKeyEvent(e.code, true); if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'].includes(e.code)) e.preventDefault(); });
  window.addEventListener('keyup', (e)=>{ Input.updateFromKeyEvent(e.code, false); });
  // Jump button for touch
  window.addEventListener('load', ()=>{ Input.hookJumpButton(); sceneReady(); });

  // Audio
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  function ensureAudio(){ if(!audioCtx){ audioCtx = new AudioCtx(); } if(audioCtx.state === 'suspended'){ audioCtx.resume(); } }
  function playQuak(){ ensureAudio(); const t = audioCtx.currentTime; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.frequency.value = 320; o.type='sine'; g.gain.value = 0; g.gain.linearRampToValueAtTime(0.25, t+0.02); g.gain.exponentialRampToValueAtTime(0.0001, t+0.25); o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.26); }
  function playCardSound(){ ensureAudio(); const t = audioCtx.currentTime; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.frequency.value = 460; o.type='triangle'; g.gain.value = 0; g.gain.linearRampToValueAtTime(0.2, t+0.01); g.gain.exponentialRampToTime(0.0001, t+0.4); o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t+0.42); }

  // Vocabulary deck (load from DOM if provided by HTML, else fall back to embedded sample)
  let deck = [];
  function loadDeckFromDOM(){
    if(typeof document === 'undefined') return [];
    try {
      const tag = document.getElementById('vocab-data');
      if(!tag || !tag.textContent) return [];
      const parsed = JSON.parse(tag.textContent);
      if(parsed && Array.isArray(parsed.cards)){
        // Normalize to internal structure
        return parsed.cards.map(c => ({
          id: c.id || (c.GermanWord||'card')+'' ,
          GermanWord: c.GermanWord || '',
          EnglishTranslation: c.EnglishTranslation || '',
          PartOfSpeech: c.PartOfSpeech || '',
          Gender: c.Gender || '',
          pronunciation: c.pronunciationHints || c.pronunciation || '',
          exampleGerman: c.exampleGerman || '',
          exampleSentence: c.exampleSentence || '',
          category: (c.category || '').toString(),
          difficulty: c.difficulty || 1,
          audioFilePath: c.audioFilePath || ''
        }));
      }
    } catch(e){ /* ignore and fall back */ }
    return [];
  }
  deck = loadDeckFromDOM();
  if(!deck.length){ // fallback sample deck
    deck = [
      { id:'greet_hello', GermanWord:'Hallo', EnglishTranslation:'Hello', category:'greetings', pronunciation:'ha-lo', exampleGerman:'Hallo, wie geht es dir?', exampleSentence:'Hello, how are you?', PartOfSpeech:'interjection' },
      { id:'numbers_one', GermanWord:'eins', EnglishTranslation:'one', category:'numbers', pronunciation:'eins', exampleGerman:'Ich habe eins Apfel.', exampleSentence:'I have one apple.', PartOfSpeech:'number' },
      { id:'colors_red', GermanWord:'rot', EnglishTranslation:'red', category:'colors', pronunciation:'rɔt', exampleGerman:'Die Blume ist rot.', exampleSentence:'The flower is red.', PartOfSpeech:'adjective' },
      { id:'greet_goodbye', GermanWord:'Auf Wiedersehen', EnglishTranslation:'Goodbye', category:'greetings', pronunciation:'aʊ̯f viːdɐˈzeːən', exampleGerman:'Auf Wiedersehen!', exampleSentence:'Goodbye!', PartOfSpeech:'phrase' }
    ];
  }

  // World and level state
  let gate = { x: 800, y: 360, w: 50, h: 70, opened: false };
  const floorYDefault = 0;
  let world = {
    player: { x: 60, y: 360, w: 34, h: 34, vx: 0, vy: 0, onGround: false },
    gravity: 1400,
    accel: 900,
    maxSpeed: 260,
    jumpVel: -520,
  };

  // Cards & progress
  let cards = [];
  const collected = new Set();
  const cardPanel = document.getElementById('cardPanel');
  const cardCountEl = document.getElementById('card-count');
  const totalEl = document.getElementById('card-total');
  if(totalEl) totalEl.textContent = deck.length.toString();
  function spawnCards(){ cards.length = 0; for(let i=0;i<deck.length;i++){ const c = { id: deck[i].id, data: deck[i], x: 140 + i*170, y: 320 - (i%2)*40, w: 34, h: 34, collected: false }; cards.push(c); } }
  spawnCards();

  // Gates, subtle end-of-level gate
  const gate = { x: 800, y: 360, w: 50, h: 70, opened: false };

  // Spawning helper for UI card details
  const cardPanelClose = document.getElementById('cardClose');
  if(cardPanelClose){ cardPanelClose.addEventListener('click', ()=>{ cardPanel.hidden = true; }); }
  function showCard(card){ if(!cardPanel) return; cardPanel.hidden = false; const c = card.data; document.getElementById('card-word').textContent = c.GermanWord; document.getElementById('card-translation').textContent = 'English: ' + c.EnglishTranslation; document.getElementById('card-pron').textContent = 'Pronunciation: ' + (c.pronunciation || '—'); document.getElementById('card-example').textContent = 'Example: ' + (c.exampleGerman || '') + ' / ' + (c.exampleSentence || ''); const cat = document.getElementById('card-category'); if(cat){ cat.style.background = categoryColor(c.category); } }
  function categoryColor(cat){ switch(cat){ case 'greetings': return '#4CAF50'; case 'numbers': return '#2196F3'; case 'colors': return '#E91E63'; default: return '#9C27B0'; } }

  // Progress & UI
  function updateCardUI(){ if(cardCountEl) cardCountEl.textContent = collected.size; }

  // World map overlay (compat with index.html: id="mapOverlay")
  const mapBtn = document.getElementById('mapBtn');
  const mapOverlay = document.getElementById('mapOverlay') || document.getElementById('world-map');
  const closeMap = document.getElementById('closeMap');
  const goRegion2 = document.getElementById('goRegion2');
  if(mapBtn){ mapBtn.addEventListener('click', ()=>{ if(mapOverlay) mapOverlay.hidden = !mapOverlay.hidden; }); }
  if(closeMap){ closeMap.addEventListener('click', ()=>{ if(mapOverlay) mapOverlay.hidden = true; }); }
  function updateMapGate(){ if(collected.size >= 3){ if(goRegion2) goRegion2.disabled = false; } else { if(goRegion2) goRegion2.disabled = true; } }
  if(goRegion2){ goRegion2.addEventListener('click', ()=>{ if(mapOverlay) mapOverlay.hidden = true; alert('Region 2 unlocked! (prototype)'); }); }

  // Save/load (progress and settings)
  const SAVE_KEY = 'frogquak_progress_v1';
  function saveProgress(){ const payload = { t: Date.now(), collected: Array.from(collected), deckVersion: 1, gatesOpened: gate.opened, player: { x: world.player.x, y: world.player.y } }; try{ localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); logEvent('save', payload); }catch(e){} }
  function loadProgress(){ try{ const raw = localStorage.getItem(SAVE_KEY); if(raw){ const p = JSON.parse(raw); if(p && p.collected){ p.collected.forEach(id => collected.add(id)); } if(p.player){ world.player.x = p.player.x; world.player.y = p.player.y; } if(p.gatesOpened){ gate.opened = p.gatesOpened; } } }catch(e){} updateCardUI(); updateMapGate(); }
  // simple analytics logger
  function logEvent(name, data){ try{ const blob = { name, ts: Date.now(), data }; console && console.log('[FrogQuak]', blob); }catch(e){} }
  // allow manual save via S key
  window.addEventListener('keydown', (e)=>{ if(e.key.toLowerCase()==='s' && (e.metaKey||e.ctrlKey||e.altKey===false)){ e.preventDefault(); saveProgress(); logEvent('manual-save', { reason:'keyboard' }); } });
  // load on first user interaction to comply with autoplay rules
  window.addEventListener('pointerdown', ()=>{ if(!audioCtx){ /* lazy */ } });
  loadProgress();

  // Card collection utility
  function collectCard(card){ if(collected.has(card.id)) return; collected.add(card.id); updateCardUI(); updateMapGate(); playCardSound(); showCard(card); saveProgress(); logEvent('card-collected', { cardId: card.id, total: collected.size }); }

  // Simple AABB collision helper
  function aabb(ax,ay,aw,ah,bx,by,bw,bh){ return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by; }

  // Ground/Levels constants
  let lastGround = true;
  function resetPlayer(){ world.player.x = 60; world.player.y = 360; world.player.vx = 0; world.player.vy = 0; world.player.onGround = false; }
  resetPlayer();

  // Card panel close wiring (in case DOM loaded later)
  if(cardPanel){ const closer = document.getElementById('cardClose'); if(closer) closer.addEventListener('click', ()=>{ cardPanel.hidden = true; }); }

  // World geometry and cards positioning
  function spawnCardsAtDesign(){ cards.length = 0; for(let i=0;i<deck.length;i++){ const c = { id: deck[i].id, data: deck[i], x: 140 + i*170, y: 320 - (i%2)*40, w: 34, h: 34, collected: false }; cards.push(c); } }
  spawnCardsAtDesign();

  // Core game loop with improved physics: coyote time, variable jump height, and audio on events
  let last = performance.now();
  let coyoteTime = 0; const COYOTE = 0.12; // seconds
  let isJumping = false; // for variable jump height
  function loop(now){ const dt = Math.min(0.033, (now - last)/1000); last = now; // dt in seconds
    // input: horizontal
    const left = Input.isPressed('left'); const right = Input.isPressed('right'); let dir = 0; if(left) dir -= 1; if(right) dir += 1;
    if(dir !== 0){ world.player.vx += dir * world.accel * dt; if(world.player.vx > world.maxSpeed) world.player.vx = world.maxSpeed; if(world.player.vx < -world.maxSpeed) world.player.vx = -world.maxSpeed; }
    else { world.player.vx *= 0.88; if(Math.abs(world.player.vx) < 5) world.player.vx = 0; }

    // vertical physics with coyote time
    // graceful gravity application
    world.player.vy += world.gravity * dt;

    // jump handling using jumpQueued (one-shot)
    if (Input.consumeJump()){
      const canJump = world.player.onGround || coyoteTime > 0;
      if(canJump){ world.player.vy = world.jumpVel; world.player.onGround = false; isJumping = true; coyoteTime = 0; playQuak(); }
    }

    // update position
    world.player.x += world.player.vx * dt; world.player.y += world.player.vy * dt;

    // floor collision
    const floorY = canvas.height - 60; if(world.player.y + world.player.h > floorY){ world.player.y = floorY - world.player.h; world.player.vy = 0; world.player.onGround = true; isJumping = false; }
    // coyote timer when in air
    if(!world.player.onGround){ coyoteTime = Math.max(0, coyoteTime - dt); } else { coyoteTime = COYOTE; }

    // bounds
    if(world.player.x < 0){ world.player.x = 0; world.player.vx = 0; }
    if(world.player.x + world.player.w > canvas.width){ world.player.x = canvas.width - world.player.w; world.player.vx = 0; }

    // collisions with cards
    for(let c of cards){ if(!c.collected && world.player.x < c.x + c.w && world.player.x + world.player.w > c.x && world.player.y < c.y + c.h && world.player.y + world.player.h > c.y){ c.collected = true; collected.add(c.id); updateCardUI(); updateMapGate(); playCardSound(); collectCard(c); } }

    // gate logic
    if(!gate.opened && aabb(world.player.x, world.player.y, world.player.w, world.player.h, gate.x, gate.y, gate.w, gate.h)){ gate.opened = true; logEvent('gate-open', { x: gate.x }); }

    // render scene
    render();
    // update UI cues
    updateMapGate();

    requestAnimationFrame(loop);
  }

  function render(){ if(!ctx || !canvas) return; // clear
    ctx.clearRect(0,0,canvas.width, canvas.height);
    // sky gradient
    const sky = ctx.createLinearGradient(0,0,0,canvas.height); sky.addColorStop(0,'#b3e0ff'); sky.addColorStop(0.5,'#7ed0ff'); sky.addColorStop(1,'#9bd0ff'); ctx.fillStyle = sky; ctx.fillRect(0,0,canvas.width, canvas.height);

    // distant hills
    ctx.fillStyle = '#7bd389'; ctx.beginPath(); ctx.moveTo(0, canvas.height*0.65); ctx.quadraticCurveTo(canvas.width*0.25, canvas.height*0.55, canvas.width*0.5, canvas.height*0.65); ctx.quadraticCurveTo(canvas.width*0.75, canvas.height*0.75, canvas.width, canvas.height*0.65); ctx.lineTo(canvas.width, canvas.height); ctx.lineTo(0, canvas.height); ctx.closePath(); ctx.fill();

    // ground // simple parallax ground layer
    ctx.fillStyle = '#74d37d'; ctx.fillRect(0, canvas.height-60, canvas.width, 60);
    ctx.strokeStyle = 'rgba(0,0,0,0.04)'; ctx.lineWidth = 1; for(let x=0; x<canvas.width; x+=12){ ctx.beginPath(); ctx.moveTo(x, canvas.height-60); ctx.lineTo(x+6, canvas.height-54); ctx.stroke(); }

    // gate
    ctx.fillStyle = gate.opened ? '#6bd16f' : '#555'; ctx.fillRect(gate.x, gate.y, gate.w, gate.h);

    // cards
    for(let c of cards){ if(!c.collected){ const g = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h); g.addColorStop(0, '#fff7a6'); g.addColorStop(1, '#ffd166'); ctx.fillStyle = g; roundRect(ctx, c.x, c.y, c.w, c.h, 6); ctx.fill(); ctx.fillStyle = '#333'; ctx.font = '12px sans-serif'; ctx.fillText('CARD', c.x+4, c.y+14); } }

    // frog/player
    drawFrog(world.player.x, world.player.y, world.player.w, world.player.h);
  }

  // canvas helpers
  function roundRect(ctx, x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r); ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath(); ctx.fill(); }

  function drawFrog(px, py, w, h){ // simple frog cartoon
    const g = ctx.createRadialGradient(px + w*0.5, py + h*0.5, w*0.2, px + w*0.5, py + h*0.5, w*0.9);
    g.addColorStop(0, '#7bd56b'); g.addColorStop(1, '#2e8d2e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px + w*0.5, py + h*0.5, w*0.38, h*0.5, 0, 0, Math.PI*2); ctx.fill();
    // eyes
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px + w*0.28, py + h*0.28, 5, 0, Math.PI*2); ctx.arc(px + w*0.72, py + h*0.28, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px + w*0.28, py + h*0.28, 2, 0, Math.PI*2); ctx.arc(px + w*0.72, py + h*0.28, 2, 0, Math.PI*2); ctx.fill();
    // mouth
    ctx.strokeStyle = '#1b5e20'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + w*0.22, py + h*0.58); ctx.quadraticCurveTo(px + w*0.5, py + h*0.66, px + w*0.78, py + h*0.58); ctx.stroke();
  }

  // initialization of cards and visibility based on dom after load
  function sceneReady(){ // ensure deck cards exist and visuals ready
    // ensure cards are drawn from deck data
    if(deck.length && cards.length === 0) spawnCards();
  }

  // Start the loop after assets ready
  window.requestAnimationFrame(function boot(now){ last = now; loop(now); });
})();
