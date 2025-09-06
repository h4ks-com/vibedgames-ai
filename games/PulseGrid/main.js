export function init(){
  // Pulse Grid core: color-sequence memory game using on-screen tiles and optional keyboard 1-6 input
  const tilesEl = document.getElementById('tiles');
  const startBtn = document.getElementById('startBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const endModal = document.getElementById('endModal');
  const endSummary = document.getElementById('endSummary');
  const playAgain = document.getElementById('playAgain');
  const closeEnd = document.getElementById('closeEnd');
  const tutorialOverlay = document.getElementById('tutorialOverlay');
  const tutorialSkip = document.getElementById('tutorialSkip');
  const themeSelect = document.getElementById('themeSelect');
  const scoreValue = document.getElementById('scoreValue');
  const roundValue = document.getElementById('roundValue');
  const accValue = document.getElementById('accValue');
  const liveStatus = document.getElementById('liveStatus');

  // 6 color palette
  const COLORS = [
    { name: 'Red', hex: '#ff3b30' },
    { name: 'Green', hex: '#34c759' },
    { name: 'Blue', hex: '#007aff' },
    { name: 'Yellow', hex: '#ffd400' },
    { name: 'Purple', hex: '#8e44ad' },
    { name: 'Cyan', hex: '#00d0ff' }
  ];

  // Audio (Web Audio API)
  let audioCtx = null;
  let sfxOn = true;
  const frequencies = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
  function initAudio(){ if(audioCtx) return; try { const AC = window.AudioContext || window.webkitAudioContext; audioCtx = new AC(); }catch(e){ audioCtx = null; } }
  function playTone(index, durationMs = 160){ if(!audioCtx || !sfxOn) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.type = 'sine'; osc.frequency.value = frequencies[index % frequencies.length]; osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime; gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.25, now + 0.01); gain.gain.linearRampToValueAtTime(0.0, now + durationMs/1000); osc.start(now); osc.stop(now + durationMs/1000); }

  // Seeded RNG for reproducible testing
  function RNG(seed){ this.seed = seed >>> 0; this.next = function(){ this.seed = (1664525 * this.seed + 1013904223) % 4294967296; return this.seed; }; this.nextInt = function(min, max){ const range = max - min + 1; return min + (this.next() % range); }; this.setSeed = function(s){ this.seed = (s >>> 0); }; }

  // Persistent seed across sessions (optional for testing)
  let rngSeed = Number(localStorage.getItem('pulsegrid_seed') || 0);
  if(!rngSeed){ rngSeed = Math.floor(Math.random() * 1e9); localStorage.setItem('pulsegrid_seed', String(rngSeed)); }
  const rng = new RNG(rngSeed);

  // Game state
  let sequence = [];
  let round = 0;
  let currentIndex = 0; // player index within sequence
  let score = 0;
  let inputEnabled = false;
  let perfectRound = true;
  let started = false;
  let tapsTotal = 0; let tapsCorrect = 0;
  let flashDelay = 550; // ms between flashes, will decrease with rounds for difficulty ramp

  function renderTiles(){ tilesEl.innerHTML = '';
    COLORS.forEach((c, idx)=>{
      const t = document.createElement('button');
      t.className = 'tile';
      t.style.background = c.hex; t.setAttribute('aria-label', c.name + ' tile'); t.setAttribute('data-index', String(idx));
      t.style.width = 'clamp(90px, 16vw, 120px)'; t.style.height = 'clamp(90px, 16vw, 120px)'; t.style.borderRadius = '16px'; t.style.border = '0';
      t.addEventListener('click', ()=> onTileTap(idx));
      t.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); onTileTap(idx);} });
      tilesEl.appendChild(t);
    });
  }

  function updateHUD(){ scoreValue && (scoreValue.textContent = String(score)); if(roundValue) roundValue.textContent = String(round); // accuracy
    const acc = tapsTotal ? Math.round((tapsCorrect / tapsTotal) * 100) : 0;
    if(accValue) accValue.textContent = acc + '%'; if(liveStatus) liveStatus.textContent = `Round ${round}, Score ${score}, Accuracy ${acc}%`;
  }

  function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

  async function showSequence(){ inputEnabled = false; perfectRound = true; // reset per round
    for(let i=0; i<sequence.length; i++){
      const idx = sequence[i]; const tile = tilesEl.children[idx]; if(tile){ tile.classList.add('flash'); playTone(idx, 180); }
      await sleep(180); if(tile) tile.classList.remove('flash');
      await sleep(Math.max(60, flashDelay - (round*2))); // speed up with rounds
    }
    inputEnabled = true; currentIndex = 0; announce('Your turn: tap the tiles in order.');
  }

  function announce(text){ if(liveStatus) liveStatus.textContent = text; }

  function onTileTap(index){ if(!inputEnabled) return; tapsTotal++; if(index === sequence[currentIndex]){ tapsCorrect++; // visual feedback
      const tile = tilesEl.children[index]; if(tile){ tile.classList.add('correct'); playTone(index, 120); setTimeout(()=> tile.classList.remove('correct'), 180);} currentIndex++;
      if(currentIndex >= sequence.length){ // round cleared
        score += 10 * sequence.length; if(perfectRound) score += 20; updateHUD(); inputEnabled = false; announce('Round complete. Next round.'); setTimeout(()=> nextRound(), 600); }
    } else { // mistake
      perfectRound = false; inputEnabled = false; // visual/auditory miss cue
      const tile = tilesEl.children[index]; if(tile){ tile.classList.add('flash'); playTone(index, 200); setTimeout(()=> tile.classList.remove('flash'), 220);} announce('Incorrect. Game over.'); endGame(false); }
  }

  function endGame(win){ // win param not used for now; show summary
    saveHighScore();
    const hs = Number(localStorage.getItem('pulsegrid_highscore') || '0');
    endSummary.innerHTML = `Game over! Final score: <strong>${score}</strong>. High score: <strong>${Math.max(hs, score)}</strong>.`;
    endModal.hidden = false; inputEnabled = false; started = false;
  }

  function saveHighScore(){ const hs = Number(localStorage.getItem('pulsegrid_highscore') || '0'); if(score > hs) localStorage.setItem('pulsegrid_highscore', String(score)); }

  // Game progression
  async function nextRound(){ sequence = []; currentIndex = 0; tapsTotal = 0; tapsCorrect = 0; perfectRound = true; round += 1; // push new color
    flashDelay = Math.max(180, 550 - (round * 8)); const nextIdx = rng.nextInt(0, COLORS.length-1); sequence.push(nextIdx); updateHUD(); announce(`Round ${round}. Watch the sequence.`); // show after a short pause
    await sleep(400); await showSequence(); }

  function handleKeyInput(e){ const k = e.key; if(!/^[1-6]$/.test(k)) return; const idx = parseInt(k, 10) - 1; onTileTap(idx); }

  function applyTheme(theme){ document.documentElement.classList.remove('theme-neon','theme-warm','theme-cool'); if(theme){ document.documentElement.classList.add('theme-' + theme); } }

  function bindEvents(){
    startBtn && startBtn.addEventListener('click', ()=>{ // reset state and start first round
      sequence = []; currentIndex = 0; round = 0; score = 0; tapsTotal = 0; tapsCorrect = 0; started = true; perfectRound = true; endModal && (endModal.hidden = true); updateHUD(); nextRound(); });
    if(settingsBtn){ settingsBtn.addEventListener('click', ()=> { const panel = document.getElementById('settingsPanel'); panel && (panel.hidden = !panel.hidden); }); }
    if(tutorialSkip){ tutorialSkip.addEventListener('click', ()=> { if(tutorialOverlay) tutorialOverlay.hidden = true; }); }
    if(playAgain){ playAgain.addEventListener('click', ()=> { endModal.hidden = true; sequence = []; round = 0; score = 0; tapsTotal = 0; tapsCorrect = 0; started = false; updateHUD(); nextRound(); }); }
    if(closeEnd){ closeEnd.addEventListener('click', ()=> { endModal && (endModal.hidden = true); }); }
    document.addEventListener('keydown', handleKeyInput);
    renderTiles();
  }

  // Init
  initAudio(); renderTiles(); bindEvents(); applyTheme('neon'); updateHUD();
}

window.addEventListener('DOMContentLoaded', ()=>{ init(); });
