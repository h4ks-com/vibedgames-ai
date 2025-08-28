// Core functionality for Neon Pulse Puzzle
const startBtn = document.getElementById('startBtn');
const settingsBtn = document.getElementById('settingsBtn');
const gameContainer = document.getElementById('gameContainer');
const instructions = document.getElementById('instructions');

let gameState = {
  level: 1,
  score: 0,
  vibe: {
    color: 0,
    intensity: 0.5,
    mood: 'energetic'
  },
  isPlaying: false,
  currentNodes: [],
  activeNodeIndex: null
};

function initGame() {
  gameState.level = 1;
  gameState.score = 0;
  gameState.isPlaying = true;
  instructions.innerText = 'Match the nodes rhythmically to sustain the neon pulse.';
 createLevel(gameState.level);
}

function createLevel(level) {
  const numberOfNodes = Math.min(5 + level, 10);
  const nodes = [];
  gameContainer.innerHTML = '';
  for (let i=0; i<numberOfNodes; i++) {
    const node = document.createElement('div');
    node.className = 'node';
    node.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    node.dataset.index = i;
    node.dataset.rhythm = Math.random() * 1.5 + 0.5;
    node.dataset.colorHue = Math.random() * 360;
    node.addEventListener('click', handleNodeClick);
    gameContainer.appendChild(node);
    nodes.push(node);
  }
  gameState.currentNodes = nodes;
  gameState.activeNodeIndex = null;
  startRhythm();
}

function handleNodeClick(e) {
  const node = e.target;
  if (!gameState.isPlaying) return;
  if (gameState.activeNodeIndex === null) {
    gameState.activeNodeIndex = parseInt(node.dataset.index);
    highlightNode(node, true);
  } else {
    if (parseInt(node.dataset.index) === gameState.activeNodeIndex) {
      gameState.score += 10;
      updateScore();
      moveToNextNode();
    } else {
      gameState.score -= 5;
      updateScore();
    }
  }
}

function moveToNextNode() {
  gameState.activeNodeIndex = null;
  increaseDifficulty();
}

function startRhythm() {
  if (gameState.currentNodes) {
    gameState.currentNodes.forEach(node => {
      pulseNode(node);
    });
  }
}

function pulseNode(node) {
  node.animate([
    { boxShadow: '0 0 20px ' + node.style.backgroundColor, transform: 'scale(1)' },
    { boxShadow: '0 0 50px ' + node.style.backgroundColor, transform: 'scale(1.2)' },
    { boxShadow: '0 0 20px ' + node.style.backgroundColor, transform: 'scale(1)' }
  ], {
    duration: 1000,
    iterations: 1
  });
}

function updateScore() {
  instructions.innerText = `Score: ${gameState.score}`;
}

function increaseDifficulty() {
  if (gameState.score % 50 === 0 && gameState.score !== 0) {
    gameState.level++;
    createLevel(gameState.level);
  }
}

function highlightNode(node, isActive) {
  if (isActive) {
    node.classList.add('glow');
  } else {
    node.classList.remove('glow');
  }
}

startBtn.addEventListener('click', initGame);
settingsBtn.addEventListener('click', () => {
  instructions.innerText = 'Settings coming soon.';
});
// Additional rhythm cues or audio-driven features could be added for immersive experience.