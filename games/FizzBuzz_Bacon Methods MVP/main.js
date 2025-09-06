(function(){
  // Enhanced MVP: six methods, per-round cues, timer, scoring, and basic persistence
  const onboarding = document.getElementById('screen-onboarding');
  const game = document.getElementById('screen-game');
  const result = document.getElementById('screen-result');
  const btnStart = document.getElementById('btn-start');
  const btnReplay = document.getElementById('btn-replay');
  const scoreDisplay = document.getElementById('score-display');
  const roundIndicator = document.getElementById('round-indicator');
  const cueArea = document.getElementById('cue-area');
  const promptText = document.getElementById('prompt-text');
  // 6 option buttons (1..6)
  const optionButtons = Array.from({length:6}, (_,i)=> document.getElementById(`btn-option-${i+1}`));

  // Add a tiny timer bar inside cue area for feedback
  cueArea.style.position = 'relative';
  const timerBar = document.createElement('div');
  timerBar.style.position = 'absolute';
  timerBar.style.left = '0';
  timerBar.style.bottom = '0';
  timerBar.style.height = '6px';
  timerBar.style.width = '100%';
  timerBar.style.background = '#4caf50';
  cueArea.appendChild(timerBar);

  const METHODS = [
    { id:'panfry', name:'Pan Fry' },
    { id:'oven', name:'Oven Bake' },
    { id:'microwave', name:'Microwave' },
    { id:'airfryer', name:'Air Fryer' },
    { id:'grill', name:'Grill' },
    { id:'broil', name:'Broil' }
  ];

  const PROMPTS = [
    { cue:'Crisp edges', best:'panfry' },
    { cue:'Even surface', best:'oven' },
    { cue:'Quick heat', best:'microwave' },
    { cue:'Grease-free', best:'airfryer' },
    { cue:'Smoky/char', best:'grill' },
    { cue:'Top browning', best:'broil' }
  ];

  // Settings and state
  function getDifficulty(){ return localStorage.getItem('vb_difficulty') || 'normal'; }
  function getTimePerRound(){
    const d = getDifficulty();
    if(d==='easy') return 6000;
    if(d==='hard') return 3000;
    return 4000; // normal
  }

  const state = {
    currentRound: 0,
    totalRounds: PROMPTS.length,
    score: 0,
    started:false,
    timerId: null,
    roundStart: 0,
    idealTime: 0,
    streak: 0,
  };

  // UI helpers
  function updateScoreDisplay(){ scoreDisplay.textContent = 'Score: ' + state.score; }
  function endGame(){
    const finalElem = document.getElementById('final-score');
    const endingElem = document.getElementById('final-ending');
    finalElem.textContent = 'Final Score: ' + state.score;
    const s = state.score;
    if(s >= 400) endingElem.textContent = 'Legendary Bacon Mastery';
    else if(s >= 200) endingElem.textContent = 'Tasty Pro';
    else endingElem.textContent = 'Nice try, chef';
    onboarding.classList.remove('active');
    game.classList.remove('active');
    result.classList.add('active');
    saveHighScore(state.score);
  }

  // Simple high score persistence (local only)
  function saveHighScore(score){
    const key = 'vb_highscores';
    let arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr.push({ score: score, date: new Date().toISOString() });
    arr = arr.sort((a,b)=> b.score - a.score).slice(0,10);
    localStorage.setItem(key, JSON.stringify(arr));
    renderHighScores(arr);
  }
  function renderHighScores(list){
    const highs = document.getElementById('highscores-list');
    if(!highs) return;
    highs.innerHTML = '';
    if(list.length===0){ highs.textContent = 'No high scores yet. Be the first!'; return; }
    const ul = document.createElement('ul');
    for(const e of list){
      const li = document.createElement('li');
      const date = new Date(e.date);
      li.textContent = `${e.score} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      ul.appendChild(li);
    }
    highs.appendChild(ul);
  }

  function startRoundTimer(totalTime){
    state.roundStart = performance.now();
    // ideal time with light jitter for flavor
    const jitter = (Math.random() - 0.5) * 0.4; // +/-0.2
    state.idealTime = totalTime * (0.5 + jitter);
    // reset timer bar
    timerBar.style.width = '100%';
    function tick(){
      const elapsed = performance.now() - state.roundStart;
      const remaining = Math.max(totalTime - elapsed, 0);
      const pct = (remaining / totalTime) * 100;
      timerBar.style.width = Math.max(0, Math.min(100, pct)) + '%';
      // reflect time in cue area
      const s = Math.ceil(remaining/1000);
      cueArea.firstChild && (cueArea.firstChild.textContent = 'Cue: ' + PROMPTS[state.currentRound].cue + ' - ' + s + 's');
      if(remaining <= 0){
        clearInterval(state.timerId);
        state.timerId = null;
        handleMiss('timeout');
      }
    }
    state.timerId = setInterval(tick, 50);
  }

  function renderRound(){
    const r = state.currentRound;
    roundIndicator.textContent = `Round ${r+1}/${state.totalRounds}`;
    const p = PROMPTS[r];
    promptText.textContent = 'Choose the method that matches the cue.';
    // Fill buttons
    for(let i=0;i<6;i++){
      const btn = optionButtons[i];
      btn.textContent = METHODS[i].name;
      btn.dataset.method = METHODS[i].id;
      btn.disabled = false;
      btn.classList.remove('hit','miss');
    }
    const totalTime = getTimePerRound();
    if(state.timerId) clearInterval(state.timerId);
    startRoundTimer(totalTime);
    // initialize cue text once more
    cueArea.textContent = 'Cue: ' + p.cue;
  }

  function handleMiss(reason){
    // Miss due to timeout or wrong tap
    // Apply penalty if timeout or wrong tap
    const penalty = reason === 'timeout' ? -50 : -25;
    state.score += penalty;
    state.streak = 0;
    state.currentRound += 1;
    updateScoreDisplay();
    // brief feedback
    cueArea.style.background = 'linear-gradient(135deg, #ffd6d6 0%, #f0a3a3 100%)';
    promptText.textContent = reason === 'timeout' ? 'Time! Missed round.' : 'Wrong method!';
    if(state.currentRound >= state.totalRounds){ setTimeout(endGame, 350); } else { setTimeout(renderRound, 350); }
  }

  function handleChoice(index){
    if(state.currentRound >= state.totalRounds) return;
    const chosen = METHODS[index].id;
    const target = PROMPTS[state.currentRound].best;
    const now = performance.now();
    const elapsed = (state.roundStart ? (now - state.roundStart) : 0);
    if(state.timerId){ clearInterval(state.timerId); state.timerId = null; }
    const totalTime = getTimePerRound();
    const timeRemaining = Math.max(totalTime - elapsed, 0);

    const isHit = (chosen === target) && (elapsed <= totalTime);

    // compute delta against ideal time
    let delta = Math.abs(elapsed - state.idealTime);
    delta = Math.min(delta, totalTime);

    const timeBonus = Math.floor((timeRemaining / totalTime) * 50);
    // accuracy multiplier
    let accuracyMultiplier = 1.0;
    const w1 = totalTime * 0.15;
    const w2 = totalTime * 0.28;
    const w3 = totalTime * 0.45;
    if(delta <= w1) accuracyMultiplier = 1.5;
    else if(delta <= w2) accuracyMultiplier = 1.25;
    else if(delta <= w3) accuracyMultiplier = 1.0;
    else accuracyMultiplier = 0.5;

    // combo logic
    if(isHit){ state.streak = (state.streak || 0) + 1; } else { state.streak = 0; }
    let comboMultiplier = 1.0;
    if(state.streak > 1){ comboMultiplier = Math.min(1.0 + (state.streak - 1) * 0.25, 2.0); }

    const base = 100;
    let roundScore = Math.round((base + timeBonus) * accuracyMultiplier * comboMultiplier);
    if(!isHit){ roundScore = -25; }
    state.score += roundScore;
    state.currentRound += 1;
    updateScoreDisplay();

    // visual feedback
    if(isHit){
      cueArea.style.background = 'linear-gradient(135deg, #d8ffde 0%, #aaf0b8 100%)';
      promptText.textContent = 'Hit! +' + roundScore + ' pts';
      optionButtons[index].classList.add('hit');
    } else {
      cueArea.style.background = 'linear-gradient(135deg, #ffd6d6 0%, #f19a9a 100%)';
      promptText.textContent = 'Miss! ' + roundScore + ' pts';
      optionButtons[index].classList.add('miss');
    }

    if(state.currentRound >= state.totalRounds){ setTimeout(endGame, 350); }
    else { setTimeout(renderRound, 350); }
  }

  function initUIHandlers(){
    optionButtons.forEach((btn, idx)=>{
      btn.addEventListener('click', ()=> handleChoice(idx));
      btn.addEventListener('touchstart', e => { e.preventDefault(); btn.click(); }, {passive:false});
    });
  }

  btnStart.addEventListener('click', ()=>{
    onboarding.classList.remove('active');
    result.classList.remove('active');
    game.classList.add('active');
    state.started = true;
    state.currentRound = 0;
    state.score = 0;
    state.streak = 0;
    updateScoreDisplay();
    renderRound();
  });

  btnReplay.addEventListener('click', ()=>{
    result.classList.remove('active');
    onboarding.classList.add('active');
  });

  // Init
  (function init(){
    onboarding.classList.add('active');
    game.classList.remove('active');
    result.classList.remove('active');
    // populate high scores if present
    const highs = JSON.parse(localStorage.getItem('vb_highscores') || '[]');
    renderHighScores(highs);
    // default difficulty
    if(!localStorage.getItem('vb_difficulty')) localStorage.setItem('vb_difficulty', 'normal');
    initUIHandlers();
  })();
})();