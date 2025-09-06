(function(){'use strict';
  // FizzBuzz Voyager Deluxe - deterministic six-prompt flow with a scoring system
  // This module implements onboarding -> game (6 prompts) -> result flow with accessible UI.
  // Data model: PROMPTS is exactly 6 prompts, each with 3 options that have fixed scores (1|2|3).
  // Endings are computed via a simple score normalization: scaled = totalScore - 6;
  //   scaled <= 3 -> Mild Mellow
  //   scaled <= 7 -> Cheesy Champion
  //   else -> Gouda Guru
  // Optional play again flow resets state and returns to onboarding.

  // Deterministic dataset: six prompts with three options each
  const PROMPTS = [
    {
      text: "The market is bright and breezy as sunlit stalls glow with fresh cheese.",
      options: [
        { text: "Cheddar", score: 1, tag: 'classic' },
        { text: "Brie", score: 3, tag: 'fancy' },
        { text: "Gouda", score: 2, tag: 'bold' }
      ]
    },
    {
      text: "A vendor smiles and asks how you'd like to enjoy your bite today.",
      options: [
        { text: "Pair with wine", score: 3, tag: 'fancy' },
        { text: "Add crackers", score: 1, tag: 'classic' },
        { text: "Save for later", score: 2, tag: 'bold' }
      ]
    },
    {
      text: "Back at the counter, you picture creamy textures and little sparkles of flavor.",
      options: [
        { text: "Cheddar", score: 1, tag: 'classic' },
        { text: "Brie", score: 3, tag: 'fancy' },
        { text: "Gouda", score: 2, tag: 'bold' }
      ]
    },
    {
      text: "Another stall hums with bells—what's your snack plan for joy?",
      options: [
        { text: "Pair with wine", score: 3, tag: 'fancy' },
        { text: "Add crackers", score: 1, tag: 'classic' },
        { text: "Save for later", score: 2, tag: 'bold' }
      ]
    },
    {
      text: "You spot Gouda, Brie, and Cheddar—bold, fancy, or classic—what's your vibe?",
      options: [
        { text: "Gouda", score: 2, tag: 'bold' },
        { text: "Brie", score: 3, tag: 'fancy' },
        { text: "Cheddar", score: 1, tag: 'classic' }
      ]
    },
    {
      text: "The finale: pair with wine, add crackers, or save for later?",
      options: [
        { text: "Pair with wine", score: 3, tag: 'fancy' },
        { text: "Add crackers", score: 1, tag: 'classic' },
        { text: "Save for later", score: 2, tag: 'bold' }
      ]
    }
  ];

  const ENDINGS = {
    'Mild Mellow': [
      'Soft and mellow—your vibe is mellow cheddar on a sunny breeze.',
      'Calm and cozy, you savor every bite and moment.',
      'Market magic settles into a gentle grin—pleasant and peaceful.'
    ],
    'Cheesy Champion': [
      'Gouda-mazing energy! You are a Cheesy Champion.',
      'Brie-lieve in great taste; your vibe is grate.',
      'Stay grate, champ; your cheesy charisma leads the way.'
    ],
    'Gouda Guru': [
      'Gouda Guru—grate-fully wise, aging like fine cheese.',
      'Your insights are sharp as cheddar and smooth as Gouda.',
      'Share your gouda wisdom with the world—grate ideas!'
    ]
  };

  // State
  let currentIndex = 0;
  let totalScore = 0;
  let keyboardBound = false;

  // UI Elements (expected in HTML)
  const screenOnboarding = document.getElementById('screen-onboarding');
  const screenGame = document.getElementById('screen-game');
  const screenResult = document.getElementById('screen-result');
  const btnStart = document.getElementById('btn-start');
  const btnReplay = document.getElementById('btn-replay');
  const promptText = document.getElementById('prompt-text');
  const promptCounter = document.getElementById('prompt-counter');
  const option1 = document.getElementById('btn-option-1');
  const option2 = document.getElementById('btn-option-2');
  const option3 = document.getElementById('btn-option-3');
  const scoreDisplay = document.getElementById('score-display');
  const finalScore = document.getElementById('final-score');
  const finalEnding = document.getElementById('final-ending');
  const scoreLive = document.getElementById('score-live') || { textContent: '' };

  function showScreen(screen){
    [screenOnboarding, screenGame, screenResult].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
  }

  function renderPrompt(index){
    const p = PROMPTS[index];
    promptText.textContent = p.text;
    const opts = p.options;
    option1.textContent = opts[0].text; option1.dataset.score = String(opts[0].score); option1.dataset.tag = opts[0].tag;
    option2.textContent = opts[1].text; option2.dataset.score = String(opts[1].score); option2.dataset.tag = opts[1].tag;
    option3.textContent = opts[2].text; option3.dataset.score = String(opts[2].score); option3.dataset.tag = opts[2].tag;
    promptCounter.textContent = `Prompt ${index+1} of 6`;

    // Bind option handlers (one per render)
    option1.onclick = ()=> handleChoice(parseInt(option1.dataset.score, 10));
    option2.onclick = ()=> handleChoice(parseInt(option2.dataset.score, 10));
    option3.onclick = ()=> handleChoice(parseInt(option3.dataset.score, 10));

    // Enable keyboard navigation once
    bindKeyboardIfNeeded();
  }

  function bindKeyboardIfNeeded(){
    if(keyboardBound) return;
    keyboardBound = true;
    const btns = [option1, option2, option3];
    document.addEventListener('keydown', (e)=>{
      if(screenGame.classList.contains('active')){
        if(['ArrowRight','ArrowLeft'].includes(e.key)){
          const idx = btns.indexOf(document.activeElement);
          if(idx >= 0){
            const next = btns[(idx + (e.key==='ArrowRight'?1:-1) + btns.length) % btns.length];
            next.focus();
            e.preventDefault();
          }
        } else if(['Enter',' '].includes(e.key)){
          if(document.activeElement && btns.includes(document.activeElement)){
            document.activeElement.click();
            e.preventDefault();
          }
        }
      }
    }, {passive:true});
  }

  function handleChoice(scoreDelta){
    totalScore += scoreDelta;
    scoreDisplay.textContent = `Score: ${totalScore}`;
    if(currentIndex + 1 < PROMPTS.length){
      currentIndex += 1;
      renderPrompt(currentIndex);
    } else {
      finishGame();
    }
  }

  function finishGame(){
    const scaled = totalScore - PROMPTS.length; // normalization per spec
    let tier;
    if(scaled <= 3){ tier = 'Mild Mellow'; }
    else if(scaled <= 7){ tier = 'Cheesy Champion'; }
    else { tier = 'Gouda Guru'; }
    finalScore.textContent = `Final Score: ${totalScore}  (${tier})`;
    finalEnding.textContent = ENDINGS[tier].join('\n');
    showScreen(screenResult);
  }

  // Expose a tiny API for potential integration/testing
  window.fbv = {
    getCurrentScore: ()=> totalScore,
    getCurrentPrompt: ()=> PROMPTS[currentIndex] ? PROMPTS[currentIndex].text : null
  };

  // Start flow
  function startGame(){
    currentIndex = 0;
    totalScore = 0;
    scoreDisplay.textContent = `Score: ${totalScore}`;
    showScreen(screenGame);
    renderPrompt(currentIndex);
  }

  function initializeGame(){
    currentIndex = 0; totalScore = 0; keyboardBound = false; showScreen(screenOnboarding);
  }

  btnStart.addEventListener('click', startGame);
  btnReplay.addEventListener('click', ()=>{
    initializeGame();
    showScreen(screenOnboarding);
  });

  // Init when DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initializeGame);
  } else {
    initializeGame();
  }
})();
