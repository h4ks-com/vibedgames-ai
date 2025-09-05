(function(){
  'use strict';

  // FizzBuzz Voyager MVP core logic
  // Vanilla JS MVP with timeline 1-100, four labels, educational glimpses, persistence, accessibility hooks

  // Localization data (EN/ES)
  const I18N = {
    en: {
      title: 'FizzBuzz Voyager MVP',
      timeline: 'Timeline 1–100',
      current: 'Current #',
      score: 'Score',
      streak: 'Streak',
      accuracy: 'Accuracy',
      glimpse: 'Educational Glimpse',
      label: 'Label',
      fizz: 'Fizz',
      buzz: 'Buzz',
      fizzbuzz: 'FizzBuzz',
      number: 'Number',
      current_label: 'Current label',
      export: 'Export',
      import: 'Import',
      pause: 'Pause',
      resume: 'Resume'
    },
    es: {
      title: 'Navegante FizzBuzz MVP',
      timeline: 'Línea de tiempo 1–100',
      current: 'Número actual',
      score: 'Puntuación',
      streak: 'Racha',
      accuracy: 'Precisión',
      glimpse: 'Vislumbre educativo',
      label: 'Etiqueta',
      fizz: 'Fizz',
      buzz: 'Buzz',
      fizzbuzz: 'FizzBuzz',
      number: 'Número',
      current_label: 'Etiqueta actual',
      export: 'Exportar',
      import: 'Importar',
      pause: 'Pausar',
      resume: 'Reanudar'
    }
  };

  const N = 100; // timeline length
  const LABELS = ['Fizz','Buzz','FizzBuzz','Number'];
  const LABEL_COLORS = {
    Fizz: '#4cd1ff',
    Buzz: '#ffd166',
    FizzBuzz: '#9b5cff',
    Number: '#7bd389'
  };

  // State
  const state = {
    language: 'en',
    paused: false,
    currentIndex: 0,
    score: 0,
    streak: 0,
    correctCount: 0,
    totalCount: 0,
    accuracy: 0,
    nodes: [], // { number, correctLabel, answered, chosen, glimpseViewed, timeEntered, attempts }
    timePerNode: 15,
    timeEntered: Date.now(),
  };

  // DOM refs
  const dom = {
    timeline: document.getElementById('timeline'),
    stageHeader: document.getElementById('stageHeader'),
    glimpsePanel: document.getElementById('glimpsePanel'),
    currentNum: document.getElementById('currentNum'),
    score: document.getElementById('score'),
    streak: document.getElementById('streak'),
    accuracy: document.getElementById('accuracy'),
    btnFizz: document.getElementById('btnFizz'),
    btnBuzz: document.getElementById('btnBuzz'),
    btnFizzBuzz: document.getElementById('btnFizzBuzz'),
    btnNumber: document.getElementById('btnNumber'),
    stage: document.getElementById('stage'),
    pauseBtn: document.getElementById('pauseBtn'),
    exportNarrative: document.getElementById('exportNarrative'),
    langSelect: document.getElementById('langSelect'),
    fontSize: document.getElementById('fontSize'),
    saveBtn: document.getElementById('saveBtn'),
    loadBtn: document.getElementById('loadBtn'),
    importBtn: document.getElementById('importBtn'),
    importInput: document.getElementById('importInput'),
    glimpseSummary: document.getElementById('glimpseSummary')
  };

  // Canvas for stage visuals
  const ctx = dom.stage.getContext('2d');
  let stars = [];
  let animFrame = null;

  // Glimpse dictionary per label
  const GLIMPSES = {
    Fizz: 'Multiples of 3 occur every third number. Example: 3, 6, 9.',
    Buzz: 'Multiples of 5 appear every fifth number. Example: 5, 10, 15.',
    FizzBuzz: 'Numbers divisible by both 3 and 5 occur every 15 numbers (FizzBuzz).',
    Number: 'Numbers not divisible by 3 or 5 appear as-is. Look for divisibility patterns.'
  };

  // Initialize data model for nodes
  function initNodes(){
    state.nodes = [];
    for(let i=1;i<=N;i++){
      const label = classify(i);
      state.nodes.push({ number:i, correctLabel: label, answered:false, chosen:null, glimpseViewed:false, timeEntered: Date.now(), attempts:0 });
    }
  }

  // Simple FizzBuzz classifier
  function classify(n){ if(n%15===0) return 'FizzBuzz'; if(n%3===0) return 'Fizz'; if(n%5===0) return 'Buzz'; return 'Number'; }

  // Initialize UI
  function initUI(){
    // timeline rendering
    renderTimeline();

    // stage initial content
    renderStageHeader();
    renderStageContent();

    // language
    dom.langSelect.value = state.language; dom.langSelect.addEventListener('change', ()=>{ state.language = dom.langSelect.value; renderAllUI(); printLog('Language switched to ' + state.language); printLog('Hint: press 1-4 to classify.'); });

    // font size
    dom.fontSize.value = 14; dom.fontSize.addEventListener('input', ()=>{ const v = Number(dom.fontSize.value); document.documentElement.style.fontSize = v + 'px'; printLog('Font size set to ' + v); });

    // label buttons
    dom.btnFizz.addEventListener('click', ()=> handleClassification('Fizz'));
    dom.btnBuzz.addEventListener('click', ()=> handleClassification('Buzz'));
    dom.btnFizzBuzz.addEventListener('click', ()=> handleClassification('FizzBuzz'));
    dom.btnNumber.addEventListener('click', ()=> handleClassification('Number'));

    // navigation and persistence
    dom.pauseBtn.addEventListener('click', togglePause);
    dom.exportNarrative.addEventListener('click', exportNarrative);
    dom.saveBtn.addEventListener('click', saveGame);
    dom.loadBtn.addEventListener('click', loadGame);

    dom.importBtn.addEventListener('click', ()=> dom.importInput.click());
    dom.importInput.addEventListener('change', (e)=>{ const f = e.target.files?.[0]; if(f){ const reader = new FileReader(); reader.onload = ()=> { try{ const data = JSON.parse(reader.result); loadFromData(data); } catch(err){ alert('Invalid save file'); } }; reader.readAsText(f); } });

    // keyboard shortcuts
    window.addEventListener('keydown', (e)=>{
      if(state.paused) return;
      const k = e.key;
      if(k==='1') handleClassification('Fizz');
      if(k==='2') handleClassification('Buzz');
      if(k==='3') handleClassification('FizzBuzz');
      if(k==='4') handleClassification('Number');
      if(k.toLowerCase() === 'p') togglePause();
    });
  }

  function renderTimeline(){ const el = dom.timeline; el.innerHTML = ''; for(let i=0;i<N;i++){ const nd = state.nodes[i]; const div = document.createElement('div'); div.className = 'node'; div.setAttribute('role','button'); div.setAttribute('aria-label', 'Node ' + (i+1)); div.innerHTML = `<span class="n-num">${i+1}</span>`; if(i===state.currentIndex){ div.classList.add('current'); } if(nd.answered){ div.classList.add('answered'); div.style.opacity = '0.6'; } if(nd.chosen){ const badge = document.createElement('span'); badge.style.position='absolute'; badge.style.top='-6px'; badge.style.right='-6px'; badge.style.background = LABEL_COLORS[nd.chosen]; badge.style.width='16px'; badge.style.height='16px'; badge.style.borderRadius='8px'; badge.title = nd.chosen; div.appendChild(badge); }
      // non-clickable by default; future enhancement: allow jumping only to the current index
      el.appendChild(div);
    }
  }
  function renderStageHeader(){ dom.stageHeader.textContent = I18N[state.language].title; }
  function renderStageContent(){ const cur = state.nodes[state.currentIndex]; const num = cur?.number ?? 0; const label = cur?.answered ? cur.chosen : 'Awaiting...'; dom.stageHeader.style.fontFamily = 'ui-sans-serif'; dom.stageHeader.style.fontSize = '1rem'; dom.stageHeader.style.opacity = '0.9'; dom.stageHeader.style.color = '#9bd38a'; dom.stageHeader.style.textAlign = 'center';
    if(cur && cur.answered){ dom.glimpsePanel.innerHTML = `<div class="glimpse-card"><strong>${state.language==='en' ? 'Glimpse' : 'Vislumbre'}:</strong> ${GLIMPSES[cur.correctLabel]}</div>`; } else {
      dom.glimpsePanel.innerHTML = '';
    }
  }
  function renderGlimpse(label){ if(!label) return; const t = GLIMPSES[label]; dom.glimpsePanel.innerHTML = `<div class="glimpse-card"><strong>${state.language==='en' ? 'Glimpse' : 'Vislumbre'}:</strong> ${t}</div>`; }
  function renderGlimpseIfNeeded(){ const cur = state.nodes[state.currentIndex]; if(cur && cur.answered){ renderGlimpse(cur.correctLabel); } else { dom.glimpsePanel.innerHTML = ''; } }
  function renderAllUI(){ renderTimeline(); renderStageHeader(); renderStageContent(); renderGlimpseIfNeeded(); updateStatus(); }

  function updateStatus(){ dom.currentNum.textContent = (state.nodes[state.currentIndex]?.number ?? 0); dom.score.textContent = String(state.score); dom.streak.textContent = String(state.streak); const acc = state.totalCount>0 ? Math.round((state.correctCount/state.totalCount)*100) : 0; dom.accuracy.textContent = acc + '%'; }

  function handleClassification(label){ if(state.paused) return; const idx = state.currentIndex; const node = state.nodes[idx]; if(!node || node.answered) return; node.attempts += 1; const isCorrect = label === node.correctLabel; if(isCorrect){ node.answered = true; node.chosen = label; state.correctCount += 1; state.totalCount += 1; state.score += 10 + (state.streak*2); state.streak += 1; // move to next node after short delay
        setTimeout(()=>{ state.currentIndex = Math.min(N-1, state.currentIndex + 1); node.timeEntered = Date.now(); renderAllUI(); if(state.currentIndex >= N-1){ showEndScreen(); } }, 150);
      } else {
        state.totalCount += 1; state.streak = 0; state.score = Math.max(0, state.score - 2); // show glimpse for learning
        renderGlimpse(label);
        renderAllUI();
      }
  }

  function showEndScreen(){ const overlay = document.createElement('div'); overlay.id = 'end-screen-overlay'; overlay.style.position='fixed'; overlay.style.left='0'; overlay.style.top='0'; overlay.style.width='100%'; overlay.style.height='100%'; overlay.style.background='rgba(0,0,0,0.8)'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.zIndex='9999'; overlay.innerHTML = `<div style=\"background:#111; padding:20px; border-radius:12px; color:#fff; text-align:center; max-width:560px;\">`+
      `<h2>Quiz Complete</h2><p>Final score: ${state.score}</p><p>Correct: ${state.correctCount} / ${state.totalCount}</p><button id=\"endShare\">Share Narrative</button><button id=\"endClose\">Close</button></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#endClose').onclick = ()=> overlay.remove();
    overlay.querySelector('#endShare').onclick = ()=>{ const blob = new Blob([JSON.stringify({score: state.score}, null, 2)], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'fbv-end.json'; a.click(); URL.revokeObjectURL(url); };
  }

  function saveGame(){ const payload = {
      language: state.language,
      currentIndex: state.currentIndex,
      score: state.score,
      streak: state.streak,
      correctCount: state.correctCount,
      totalCount: state.totalCount,
      nodes: state.nodes
    };
    localStorage.setItem('fbv-save-v1', JSON.stringify(payload)); alert('Progress saved'); }
  function loadGame(){ const raw = localStorage.getItem('fbv-save-v1'); if(!raw){ alert('No save found'); return; } try{ const p = JSON.parse(raw); state.language = p.language ?? 'en'; state.currentIndex = p.currentIndex ?? 0; state.score = p.score ?? 0; state.streak = p.streak ?? 0; state.correctCount = p.correctCount ?? 0; state.totalCount = p.totalCount ?? 0; state.nodes = p.nodes ?? []; renderAllUI(); } catch(e){ alert('Failed to load save'); } }
  function loadFromData(p){ if(!p) return; state.language = p.language ?? 'en'; state.currentIndex = p.currentIndex ?? 0; state.score = p.score ?? 0; state.streak = p.streak ?? 0; state.correctCount = p.correctCount ?? 0; state.totalCount = p.totalCount ?? 0; state.nodes = p.nodes ?? state.nodes; renderAllUI(); }
  function exportNarrative(){ const data = {
      language: state.language,
      currentIndex: state.currentIndex,
      score: state.score,
      streak: state.streak,
      nodes: state.nodes
    }; const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'fbv-progress.json'; a.click(); URL.revokeObjectURL(url); }

  function togglePause(){ state.paused = !state.paused; dom.pauseBtn.textContent = state.paused ? I18N[state.language].resume : I18N[state.language].pause; if(state.paused){ printLog('Paused'); } else { state.timeEntered = Date.now(); printLog('Resumed'); } }

  // Simple logging to glimpse panel
  function printLog(text){ if(!text) return; const el = document.createElement('div'); el.textContent = text; el.style.fontSize = '12px'; el.style.color = '#9bd38a'; dom.glimpsePanel.appendChild(el); if(dom.glimpsePanel.childNodes.length>6) dom.glimpsePanel.removeChild(dom.glimpsePanel.firstChild); }

  // Initialize visuals: starfield and avatar
  function initGraphics(){ const w = dom.stage.width || 900; const h = dom.stage.height || 540; stars = []; for(let i=0;i<120;i++){ stars.push({ x: Math.random()*w, y: Math.random()*h, z: Math.random()*2 + 0.5, hue: Math.random()*360 }); } }

  // Draw a simple astronaut avatar on the canvas
  function drawAstronaut(ctx2d, t){ const x = 110, y = 260; // position
    ctx2d.save();
    // glow backdrop
    const glow = ctx2d.createRadialGradient(x+60, y-10, 2, x+60, y-10, 120);
    glow.addColorStop(0, 'rgba(120,230,255,0.25)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx2d.fillStyle = glow; ctx2d.fillRect(0,0, dom.stage.width, dom.stage.height);

    // helmet
    ctx2d.fillStyle = '#d9f4ff'; ctx2d.strokeStyle = '#7bd8ff'; ctx2d.lineWidth = 2;
    ctx2d.beginPath(); ctx2d.arc(x+60, y-6, 28, 0, Math.PI*2); ctx2d.fill(); ctx2d.stroke();

    // visor inner
    ctx2d.fillStyle = '#89c9f3'; ctx2d.beginPath(); ctx2d.arc(x+60, y-6, 20, 0, Math.PI*2); ctx2d.fill();

    // suit body
    const grd = ctx2d.createLinearGradient(x+20, y+20, x+100, y+110);
    grd.addColorStop(0, '#1e5a9c'); grd.addColorStop(1, '#0b4a7a');
    ctx2d.fillStyle = grd; ctx2d.fillRect(x+20, y+20, 120, 90);
    // arms
    ctx2d.fillStyle = '#4f9bdc'; ctx2d.fillRect(x+6, y+30, 28, 14);
    ctx2d.fillRect(x+114, y+40, 28, 14);
    // legs
    ctx2d.fillStyle = '#2a6f3a'; ctx2d.fillRect(x+40, y+110, 18, 28); ctx2d.fillRect(x+78, y+110, 18, 28);
    ctx2d.restore();
  }

  // Minimal update loop for stage visuals (stars + avatar)
  function animate(){ if(!ctx) return; const w = dom.stage.width, h = dom.stage.height; // background gradient
    const g = ctx.createLinearGradient(0,0,w,h); g.addColorStop(0, '#071a38'); g.addColorStop(1, '#0b1a2b'); ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    // parallax stars
    for(let s of stars){ s.x -= s.z * 0.6; if(s.x < -5) s.x = w + 5; const alpha = 0.5 + s.z * 0.5; ctx.fillStyle = 'rgba(255,255,255,'+alpha+')'; ctx.fillRect(s.x, s.y, s.z*1.5, s.z*1.5); }
    // ship / avatar along the timeline
    ctx.save();
    // simple moving ship indicator
    const t = Math.max(0, Math.min(1, state.currentIndex / Math.max(1, N-1)));
    const shipX = 60 + t * (w - 120);
    ctx.fillStyle = '#fff'; ctx.fillRect(shipX-8, h-40, 16, 28);
    ctx.restore();
    // avatar
    drawAstronaut(ctx, 0);

    if(!state.paused){ animFrame = requestAnimationFrame(animate); }
  }

  // Start animation loop
  function startAnimation(){ initGraphics(); animate(); }

  // Initialize
  function init(){ initNodes(); initUI(); renderAllUI(); startAnimation(); }

  // Time tick for per-node timeout (keeps game moving)
  function tick(){ if(state.paused) return; const node = state.nodes[state.currentIndex]; if(node && !node.answered){ const elapsed = (Date.now() - node.timeEntered) / 1000; if(elapsed > state.timePerNode){ node.answered = true; node.chosen = null; state.streak = 0; state.totalCount += 1; state.score = Math.max(0, state.score - 3); renderAllUI(); setTimeout(()=>{ state.currentIndex = Math.min(N-1, state.currentIndex + 1); node.timeEntered = Date.now(); renderAllUI(); }, 150); } } }
  setInterval(tick, 200);

  // Kick off
  init();
})();
