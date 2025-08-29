const vibeSlider = document.getElementById('vibe-slider');
const vibeValue = document.getElementById('vibe-value');
const scenarioDiv = document.getElementById('scenario');
const newScenarioBtn = document.getElementById('new-scenario');
const interactBtn = document.getElementById('interact');
const feedbackDiv = document.getElementById('feedback');

let vibe = 50;
let scenarios = [
  'A clown juggling unicycle blades',
  'A talking teapot with existential dread',
  'A neon-lit rat in a disco',
  'A surreal dream of floating spaghetti',
  'A glitchy skeleton reading poetry',
  'A broken robot trying to dance',
  'An upside-down world with mismatched colors',
  'A paradoxical silent scream',
  'A hyperactive snail on roller skates',
  'A static TV showing static'
];

function getRandomScenario() {
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

function updateVibe(newVibe) {
  vibe = newVibe;
  vibeValue.textContent = vibe;
  document.body.style.backgroundColor = `hsl(${vibe * 3.6}, 70%, 50%)`;
  if (vibe < 25) {
    document.body.style.filter = 'blur(2px)';
  } else if (vibe > 75) {
    document.body.style.filter = 'brightness(1.2)';
  } else {
    document.body.style.filter = 'none';
  }
  if (vibe > 50) {
    document.body.classList.add('gradient-shift');
  } else {
    document.body.classList.remove('gradient-shift');
  }
}

vibeSlider.addEventListener('input', () => {
  updateVibe(parseInt(vibeSlider.value));
});

newScenarioBtn.addEventListener('click', () => {
  scenarioDiv.textContent = getRandomScenario();
  feedbackDiv.textContent = 'Let the chaos begin!';
  if (vibe > 50) {
    scenarioDiv.classList.toggle('chaos-text');
  } else {
    scenarioDiv.classList.remove('chaos-text');
  }
});

interactBtn.addEventListener('click', () => {
  const responses = [
    'Silence.',
    'That is... not funny.',
    'Why did the chicken cross? Empty.',
    'Nothing happens.',
    'Oops! Unexpected error.',
    'A glitch in the matrix.',
    'Your move, AI.',
    'Meh.',
    'Deeper into the void.',
    'Nothing to see here.'
  ];
  feedbackDiv.textContent = responses[Math.floor(Math.random() * responses.length)];
  document.body.style.transform = `skew(${Math.random() * 10}deg)`;
  setTimeout(() => {
    document.body.style.transform = 'none';
  }, 300);
  if (vibe > 50) {
    document.body.classList.add('chaos-jitter');
  } else {
    document.body.classList.remove('chaos-jitter');
  }
});

updateVibe(vibe);