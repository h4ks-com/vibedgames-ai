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

// Define actions
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
  },
  runIRCBot: () => {
    // Launch IRC bot code
    // Define IRC connection parameters
    const ircServer = 'irc.h4ks.com';
    const ircPort = 8097;
    // Connect to IRC server
    const socket = new WebSocket('ws://example.com/irc-proxy'); // Placeholder for proxy server

    // Note: Browser JavaScript cannot directly connect to IRC due to network restrictions
    // Therefore, this implementation assumes a proxy/websocket server is set up.
    // For actual implementation, you'd need a server-side component to handle IRC protocol.

    socket.onopen = () => {
      // Send command to connect to IRC (via your proxy server)
      socket.send(JSON.stringify({ command: 'connect', server: ircServer, port: ircPort }));
      // Join #lobby
      socket.send(JSON.stringify({ command: 'join', channel: '#lobby' }));
      // Send celebration message with emojis
      const message = '🎉🎊 Product Launched! 🎉🎊';
      socket.send(JSON.stringify({ command: 'privmsg', channel: '#lobby', message: message }));
    };

    socket.onerror = (error) => {
      addNews('IRC bot error: ' + error.message);
    };

    socket.onclose = () => {
      addNews('IRC bot disconnected');
    };

    addNews('IRC bot launched and message sent!');
  }
};

// Attach event listeners to buttons
document.getElementById('launchProduct').addEventListener('click', () => { actions.launchProduct(); actions.runIRCBot(); });
document.getElementById('holdMeeting').addEventListener('click', actions.holdMeeting);
document.getElementById('handlePR').addEventListener('click', actions.handlePR);
document.getElementById('investMarket').addEventListener('click', actions.investMarket);

// Initialize metrics
updateMetrics();
