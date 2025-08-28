// Simple game scripting for corporate vibe simulation
const reputationElem = document.getElementById('reputation');
const moraleElem = document.getElementById('morale');
const productivityElem = document.getElementById('productivity');
const newsFeed = document.querySelector('#news ul');

let reputation = 50;
let morale = 75;
let productivity = 60;

function updateMetrics() {
  reputationElem.textContent = reputation;
  moraleElem.textContent = morale;
  productivityElem.textContent = productivity;
}

function addNews(item) {
  const li = document.createElement('li');
  li.textContent = item;
  newsFeed.appendChild(li);
}

// Simulate leadership decisions with more dynamic and modular approach
const actions = {
  launchProduct: () => {
    addNews('Launched a new product!');
    reputation += 5;
    morale -= 2;
    updateMetrics();
  },
  holdMeeting: () => {
    addNews('Held a motivational meeting.');
    morale += 4;
    updateMetrics();
  },
  handlePR: () => {
    addNews('Handled a PR crisis successfully!');
    reputation += 8;
    morale -= 1;
    updateMetrics();
  },
  investMarket: () => {
    addNews('Invested in new markets.');
    productivity += 3;
    reputation -= 2;
    updateMetrics();
  }
};

// Attach event listeners
for (const action in actions) {
  const buttonId = action;
  document.getElementById(buttonId).addEventListener('click', actions[action]);
}

// Initialize metrics
updateMetrics();