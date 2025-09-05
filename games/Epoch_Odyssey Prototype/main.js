(function(){
  'use strict';
  // Epoch Odyssey Prototype - enhanced visuals, data-driven epochs, and safer in-game AI proxy simulation

  // Localization data (EN/ES)
  const I18N = {
    en: {
      title: 'Epoch Odyssey',
      resources: 'Resources',
      alignment: 'Alignment',
      journal: 'Journal',
      miniGame: 'Mini-Game',
      aiAlignment: 'AI Alignment',
      unlockNext: 'Unlock Next Epoch',
      exportNarrative: 'Export Narrative',
      epochBigBang: 'Big Bang',
      epochNucleosynthesis: 'Nucleosynthesis',
      epochStars: 'Formation of Stars',
      epochPlanets: 'Planetary Formation',
      epochLife: 'Life',
      epochCivilization: 'Human Civilization',
      epochComputing: 'Rise of Computing',
      epochTransformers: 'Transformers',
      miniPrompt: 'Tune a cosmic parameter to steer the epoch',
      submit: 'Submit',
      score: 'Score',
      diff: 'Difference',
      stageHint: 'Cosmic stage evolves with each tick.'
    },
    es: {
      title: 'Odisea de Épocas',
      resources: 'Recursos',
      alignment: 'Alineación',
      journal: 'Diario',
      miniGame: 'Mini-Juego',
      aiAlignment: 'Alineación de IA',
      unlockNext: 'Desbloquear Siguiente Época',
      exportNarrative: 'Exportar Narrativa',
      epochBigBang: 'Gran Big Bang',
      epochNucleosynthesis: 'Nucleosíntesis',
      epochStars: 'Formación de Estrellas',
      epochPlanets: 'Formación de Planetas',
      epochLife: 'Vida',
      epochCivilization: 'Civilización Humana',
      epochComputing: 'Ascenso de la Computación',
      epochTransformers: 'Transformers',
      miniPrompt: 'Ajusta un parámetro cósmico para dirigir la época',
      submit: 'Enviar',
      score: 'Puntuación',
      diff: 'Diferencia',
      stageHint: 'El escenario cósmico evoluciona con cada tic.'
    }
  };

  // Simple seeded RNG (LCG)
  function createRNG(seed){
    let s = seed >>> 0;
    return {
      next: function(){
        s = (1664525 * s + 1013904223) % 4294967296;
        return s / 4294967296;
      },
      int: function(min, max){ return Math.floor(this.next() * (max - min + 1)) + min; },
      clone: function(){ return createRNG(s); }
    };
  }

  // Epoch definitions (data-driven)
  const EPOCHS = [
    { id: 'bigbang', nameKey: 'epochBigBang', target: 70, gates: 0.9, description: 'Establish initial energy, inflation, and seeds.' },
    { id: 'nucleosynthesis', nameKey: 'epochNucleosynthesis', target: 65, gates: 0.9, description: 'Form light elements and primordial abundances.' },
    { id: 'stars', nameKey: 'epochStars', target: 60, gates: 0.9, description: 'Gas collapse and star formation.' },
    { id: 'planets', nameKey: 'epochPlanets', target: 68, gates: 0.9, description: 'Disk dynamics and planet formation.' },
    { id: 'life', nameKey: 'epochLife', target: 72, gates: 0.9, description: 'Abiogenesis and biosphere emergence.' },
    { id: 'civilization', nameKey: 'epochCivilization', target: 70, gates: 0.9, description: 'Agriculture, cities, knowledge.' },
    { id: 'computing', nameKey: 'epochComputing', target: 75, gates: 0.9, description: 'Computation and networks.' },
    { id: 'transformers', nameKey: 'epochTransformers', target: 80, gates: 0.9, description: 'Transformers era and alignment.' }
  ];

  // Global state
  let state = {
    seed: 0,
    epochIndex: 0,
    rng: null,
    resources: { energy: 50, matter: 50, information: 50, biosphere: 50, alignment: 50 },
    alignmentMetrics: { benevolence: 0.5, competence: 0.5, safety: 0.5, honesty: 0.5, utility: 0.5, transparency: 0.5 },
    gates: Array(EPOCHS.length).fill(0).map(()=>0), // 0..1 progress for each epoch
    mini: { target: 50, value: 50, score: 0 },
    journal: [],
    running: true,
    language: 'en',
    highContrast: false,
    fontScale: 1
  };

  // UI elements
  const els = {
    stage: null,
    miniSlider: null,
    miniPrompt: null,
    miniSubmit: null,
    miniFeedback: null,
    resBar: null,
    alignPanel: null,
    journalPanel: null,
    epochBadge: null,
    nextEpochBtn: null,
    saveBtn: null,
    loadBtn: null,
    langSelect: null,
    hcToggle: null,
    fontSize: null,
    textureSelect: null,
    exportNarrative: null
  };

  // Canvas context
  let ctx = null;
  let stars = [];

  // Helpers
  function t(key){ return I18N[state.language][key] || key; }
  function sLog(text){ const entry = { t: new Date().toISOString(), text: text }; state.journal.push(entry); if(state.journal.length > 400) state.journal.shift(); }
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  function rand(){ return state.rng.next(); }

  // Initialize seed and RNG
  function initSeedFromURL(){ const u = new URL(window.location.href); const s = parseInt(u.searchParams.get('seed'), 10); return isNaN(s) ? Math.floor(Math.random()*1e9) : s; }

  function init(){
    state.seed = initSeedFromURL();
    state.rng = createRNG(state.seed);
    state.language = 'en';
    sLog('Game initialized with seed ' + state.seed);
  }

  // UI rendering
  function renderResources(){
    const r = state.resources;
    els.resBar.innerHTML = `
      <div class="bar"><span>Energy</span><meter min="0" max="100" value="${r.energy}"></meter><span>${r.energy}</span></div>
      <div class="bar"><span>Matter</span><meter min="0" max="100" value="${r.matter}"></meter><span>${r.matter}</span></div>
      <div class="bar"><span>Information</span><meter min="0" max="100" value="${r.information}"></meter><span>${r.information}</span></div>
      <div class="bar"><span>Biosphere</span><meter min="0" max="100" value="${r.biosphere}"></meter><span>${r.biosphere}</span></div>
      <div class="bar"><span>Alignment</span><meter min="0" max="100" value="${r.alignment}"></meter><span>${r.alignment}</span></div>
    `;
  }
  function renderAlignmentPanel(){
    const m = state.alignmentMetrics;
    els.alignPanel.innerHTML = `
      <div class="align-row"><span>Benevolence</span><meter min="0" max="1" value="${m.benevolence}"></meter></div>
      <div class="align-row"><span>Competence</span><meter min="0" max="1" value="${m.competence}"></meter></div>
      <div class="align-row"><span>Safety</span><meter min="0" max="1" value="${m.safety}"></meter></div>
      <div class="align-row"><span>Honesty</span><meter min="0" max="1" value="${m.honesty}"></meter></div>
      <div class="align-row"><span>Utility</span><meter min="0" max="1" value="${m.utility}"></meter></div>
      <div class="align-row"><span>Transparency</span><meter min="0" max="1" value="${m.transparency}"></meter></div>
    `;
  }
  function renderJournal(){
    const j = state.journal.slice(-40);
    els.journalPanel.innerHTML = j.map(e => `<div class="journal-entry">${e.t}: ${e.text}</div>`).join('') || '<div>(no entries yet)</div>';
  }
  function renderEpochBadge(){
    const ep = EPOCHS[state.epochIndex];
    const name = ep ? (I18N[state.language][ep.nameKey] || ep.id) : '';
    els.epochBadge.textContent = `Epoch ${state.epochIndex+1}/${EPOCHS.length}: ${name}`;
  }

  // Stage rendering (cosmic visuals)
  function initStars(n=120){ stars = []; for(let i=0;i<n;i++){ stars.push({x: Math.random(), y: Math.random(), z: 0.2 + Math.random()*0.8}); } }
  function renderStage(){
    if(!els.stage) return;
    const w = els.stage.width, h = els.stage.height;
    ctx.clearRect(0,0,w,h);
    // dynamic gradient background based on epoch
    const hue = 210 + state.epochIndex * 6;
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, `hsl(${hue},60%,10%)`);
    g.addColorStop(1, `hsl(${hue+20},40%,6%)`);
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);

    // parallax stars
    for(let i=0;i<stars.length;i++){
      const s = stars[i];
      const depth = s.z;
      const px = (s.x * w) - (state.epochIndex * 0.6 * depth * 20);
      const py = s.y * h;
      ctx.fillStyle = `rgba(255,255,255,${0.4 + depth*0.4})`;
      ctx.fillRect((px|0) % w, (py|0), 1, 1);
    }

    // distant planets (simple gradient spheres)
    drawPlanet(w*0.25, h*0.4, 60, '#8fa9ff', '#0a0f2b');
    drawPlanet(w*0.75, h*0.35, 40, '#ffa3a3', '#2b0a0a');

    // epoch progress glow
    const epProgress = clamp(state.gates[state.epochIndex] || 0, 0, 1);
    const glowR = 120 + epProgress * 220;
    const glow = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, glowR);
    glow.addColorStop(0, 'rgba(120,200,255,0.6)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0,0,w,h);
  }
  function drawPlanet(x, y, r, inner, outer){ const g = ctx.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, inner); g.addColorStop(1, outer); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); }

  // Mini-game logic
  function resetMiniGame(){
    const target = Math.floor(20 + state.rng.next()*60);
    state.mini.target = target; state.mini.value = 50; state.mini.score = 0; if(els.miniSlider){ els.miniSlider.value = 50; }
    if(els.miniPrompt){ els.miniPrompt.textContent = I18N[state.language].miniPrompt; }
    if(els.miniFeedback){ els.miniFeedback.textContent = ''; }
  }
  function submitMiniGame(){
    const v = Number(els.miniSlider.value);
    const diff = Math.abs(v - state.mini.target);
    const base = clamp(1 - diff/50, 0, 1);
    const score = clamp(base + (state.rng.next()-0.5)*0.1, 0, 1);
    state.mini.score = score;
    // apply effects (synthetic, in-game only)
    const impact = Math.floor(score * 8);
    state.resources.energy = clamp(state.resources.energy + (state.epochIndex<4? 2: (state.epochIndex<7? 1:0)) + (impact>6?2:0), 0, 100);
    state.resources.information = clamp(state.resources.information + (score>0.5?2:0), 0, 100);
    state.alignmentMetrics.benevolence = clamp(state.alignmentMetrics.benevolence + (score*0.04),0,1);
    sLog('Mini-game epoch '+ (state.epochIndex+1) + ' score '+ Math.round(score*100) + '% target '+ state.mini.target + ' v='+v+ ' diff='+ Math.round(diff));
    elFoundNextGate();
    renderResources(); renderJournal(); renderAlignmentPanel();
  }
  function elFoundNextGate(){ const s = state.mini.score; const idx = state.epochIndex; state.gates[idx] = clamp((state.gates[idx] || 0) + s*0.5, 0, 1); if(state.gates[idx] >= 0.98 && idx < EPOCHS.length-1){ els.nextEpochBtn.disabled = false; } }

  // Save / Load
  function saveGame(){ const payload = {
      seed: state.seed,
      epochIndex: state.epochIndex,
      resources: state.resources,
      alignmentMetrics: state.alignmentMetrics,
      gates: state.gates,
      journal: state.journal,
      language: state.language,
      highContrast: state.highContrast
    };
    localStorage.setItem('eo-save', JSON.stringify(payload)); sLog('Game saved (seed '+ state.seed +')'); renderJournal(); }
  function loadGame(){ const raw = localStorage.getItem('eo-save'); if(!raw){ sLog('No saved game found'); renderJournal(); return; } try{ const p = JSON.parse(raw); state.seed = p.seed; state.epochIndex = p.epochIndex; state.resources = p.resources; state.alignmentMetrics = p.alignmentMetrics; state.gates = p.gates; state.journal = p.journal; state.language = p.language; state.highContrast = p.highContrast; state.rng = createRNG(state.seed); sLog('Loaded save (seed '+ state.seed +')'); renderAll(); }catch(e){ sLog('Failed to load save'); } }
  function exportNarrative(){ const out = { seed: state.seed, epochIndex: state.epochIndex, gates: state.gates, journal: state.journal }; const blob = new Blob([JSON.stringify(out,null,2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'eo-narrative.json'; a.click(); URL.revokeObjectURL(url); }

  // Rendering setup
  function resetUI(){ renderResources(); renderAlignmentPanel(); renderJournal(); renderEpochBadge(); if(els.nextEpochBtn) els.nextEpochBtn.disabled = true; }
  function renderAll(){ renderResources(); renderAlignmentPanel(); renderJournal(); renderEpochBadge(); renderStage(); }

  // Main loop (tick-based with requestAnimationFrame)
  let lastTs = 0; let accum = 0; const TICK_MS = 1000; // 1 second per tick
  function gameTick(ts){ if(!state.running) return; requestAnimationFrame(gameTick); if(!lastTs) { lastTs = ts; return; } const dt = ts - lastTs; lastTs = ts; accum += dt; while(accum >= TICK_MS){ advanceEpochState(); accum -= TICK_MS; renderAll(); }
  }
  function startLoop(){ lastTs = 0; requestAnimationFrame(gameTick); }
  function advanceEpochState(){ const eIdx = state.epochIndex; const p = (eIdx+1)/EPOCHS.length; // resource drift and minor progress
    state.resources.energy = clamp(state.resources.energy + Math.floor((state.rng.next()-0.5)*2 + (p*2)), 0, 100);
    state.resources.information = clamp(state.resources.information + Math.floor(state.rng.next()*2), 0, 100);
    state.resources.matter = clamp(state.resources.matter + Math.floor((state.rng.next()-0.5)*2), 0, 100);
    state.resources.biosphere = clamp(state.resources.biosphere + Math.floor((state.rng.next()-0.5)*1), 0, 100);
    state.alignmentMetrics.benevolence = clamp(state.alignmentMetrics.benevolence + (state.rng.next()-0.5)*0.02, 0, 1);
    state.gates[eIdx] = clamp((state.gates[eIdx] || 0) + (0.01 + state.rng.next()*0.02), 0, 1);
    if(state.gates[eIdx] > 0.6 && eIdx < EPOCHS.length-1){ if(els.nextEpochBtn){ els.nextEpochBtn.disabled = false; }}
    // simple AI proxy progression (fictional) – updates hidden metrics every tick
    simulateAProxyTick();
  }

  // AI alignment simulation subsystem (fictional in-game proxy)
  const AIProxy = {
    metrics: { benevolence: 0.5, competence: 0.5, safety: 0.5, honesty: 0.5, utility: 0.5, transparency: 0.5 },
    step: function(){ // subtle drift toward benevolence/ safety based on gates
      const g = state.gates[state.epochIndex] || 0;
      this.metrics.benevolence = clamp(this.metrics.benevolence + (0.001*(1-g)), 0, 1);
      this.metrics.safety = clamp(this.metrics.safety + (0.001*(1-g)), 0, 1);
      this.metrics.competence = clamp(this.metrics.competence + 0.0005, 0, 1);
      // mirror into narrative for UI (optional)
      state.alignmentMetrics.benevolence = clamp((state.alignmentMetrics.benevolence + this.metrics.benevolence)/2, 0, 1);
      renderAlignmentPanel();
    }
  };
  function simulateAProxyTick(){ AIProxy.step(); }

  // Event wiring
  function setupUI(){
    // ensure DOM refs exist
    els.stage = document.getElementById('stage');
    els.miniSlider = document.getElementById('miniSlider');
    els.miniPrompt = document.getElementById('miniPrompt');
    els.miniSubmit = document.getElementById('miniSubmit');
    els.miniFeedback = document.getElementById('miniFeedback');
    els.resBar = document.getElementById('resBar');
    els.alignPanel = document.getElementById('alignPanel');
    els.journalPanel = document.getElementById('journal');
    els.epochBadge = document.getElementById('epochBadge');
    els.nextEpochBtn = document.getElementById('nextEpoch');
    els.saveBtn = document.getElementById('saveBtn');
    els.loadBtn = document.getElementById('loadBtn');
    els.langSelect = document.getElementById('langSelect');
    els.hcToggle = document.getElementById('hcToggle');
    els.fontSize = document.getElementById('fontSize');
    els.textureSelect = document.getElementById('textureSelect');
    els.exportNarrative = document.getElementById('exportNarrative');

    // initial refs exist? if not, abort
    if(!els.stage) return;

    // translate and routing
    els.langSelect.value = state.language;
    els.langSelect.addEventListener('change', ()=>{ state.language = els.langSelect.value; renderAll(); sLog('Language set to '+ state.language); });
    if(els.hcToggle){ els.hcToggle.checked = state.highContrast; els.hcToggle.addEventListener('change', ()=>{ state.highContrast = els.hcToggle.checked; document.body.classList.toggle('hc', state.highContrast); renderAll(); sLog('High contrast '+ (state.highContrast?'enabled':'disabled')); }); }
    if(els.fontSize){ els.fontSize.value = 14; els.fontSize.addEventListener('input', ()=>{ const v = Number(els.fontSize.value); document.documentElement.style.fontSize = v + 'px'; state.fontScale = v; }); }

    if(els.miniSubmit){ els.miniSubmit.addEventListener('click', ()=> submitMiniGame()); }
    if(els.nextEpochBtn){ els.nextEpochBtn.addEventListener('click', ()=>{ if(state.epochIndex < EPOCHS.length-1){ state.epochIndex++; sLog('Advanced to epoch '+ (state.epochIndex+1)); renderAll(); els.nextEpochBtn.disabled = true; } }); }
    if(els.saveBtn){ els.saveBtn.addEventListener('click', saveGame); }
    if(els.loadBtn){ els.loadBtn.addEventListener('click', loadGame); }
    if(els.exportNarrative){ els.exportNarrative.addEventListener('click', exportNarrative); }
    if(els.textureSelect){ els.textureSelect.addEventListener('change', ()=>{ const v = els.textureSelect.value; document.documentElement.style.setProperty('--tex', v); sLog('Texture set to '+ v); renderAll(); }); }

    // initialize mini-game state
    resetMiniGame();
  }

  function renderStageSizeAndCamera(){ // reserved for future responsiveness
    // no-op placeholder for stage camera adapts to cosmos size
  }
  function renderEpochName(){ const ep = EPOCHS[state.epochIndex]; if(ep){ const name = I18N[state.language][ep.nameKey] || ep.id; if(els.epochBadge) els.epochBadge.textContent = 'Epoch ' + (state.epochIndex+1) + ': ' + name; } }

  // Init
  function start(){ init(); setupUI(); resetUI(); renderAll(); renderEpochName(); initStars(180); startLoop(); sLog('Epoch Odyssey prototype started');
  }

  window.addEventListener('beforeunload', ()=>{ saveGame(); });
  window.addEventListener('DOMContentLoaded', ()=>{ start(); });

  // Expose a graceful API (optional, not required for prototype)
  window.EO = { state, renderAll };

})();
