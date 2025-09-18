// Fix: ensure the Got it button properly hides the tutorial overlay and updates ARIA attributes
(function(){
  const tutorialEl = document.getElementById('tutorial');
  const closeBtn = document.getElementById('closeTutorialBtn');
  const openBtn = document.getElementById('openTutorialBtn');

  function showTutorial(){
    if (!tutorialEl) return;
    tutorialEl.classList.remove('hidden');
    tutorialEl.setAttribute('aria-hidden', 'false');
  }

  function hideTutorial(){
    if (!tutorialEl) return;
    tutorialEl.classList.add('hidden');
    tutorialEl.setAttribute('aria-hidden', 'true');
  }

  // Persisted seen flag: show only once
  let shown = false;
  if (typeof localStorage !== 'undefined') {
    const seen = localStorage.getItem('tutorial_seen');
    if (!seen) {
      showTutorial();
      localStorage.setItem('tutorial_seen', '1');
      shown = true;
    }
  } else {
    // If no localStorage, show by default
    showTutorial();
    shown = true;
  }

  // Button to close and hide overlay
  if (closeBtn) {
    closeBtn.addEventListener('click', function(){
      hideTutorial();
    });
  }

  // Optional: allow opening again for testing
  if (openBtn) {
    openBtn.addEventListener('click', function(){ showTutorial(); });
  }

  // Also close on Escape key for accessibility
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') {
      hideTutorial();
    }
  });
})();
