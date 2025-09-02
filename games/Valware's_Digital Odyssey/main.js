// Initialize game variables and enhance graphics for immersive experience
console.log("Valware's Digital Odyssey loaded.");

// Select main container
const container = document.getElementById('game-container');

// Style container with detailed aesthetic
Object.assign(container.style, {
  backgroundColor: '#1e1e2f',
  border: '4px solid #444',
  borderRadius: '10px',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: 'Courier New, Courier, monospace'
});

// Create a detailed character sprite with expressive features
const character = document.createElement('div');
Object.assign(character.style, {
  width: '80px',
  height: '120px',
  backgroundImage: 'linear-gradient(to bottom, #6a4e42, #2e1e0f)',
  borderRadius: '10px',
  position: 'absolute',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
});

// Create face with facial features
const face = document.createElement('div');
Object.assign(face.style, {
  width: '40px',
  height: '40px',
  backgroundColor: '#ffe0bd',
  borderRadius: '50%',
  position: 'relative',
  marginTop: '10px'
});

// Create eyes
const createEye = (leftOffset) => {
  const eye = document.createElement('div');
Object.assign(eye.style, {
  width: '8px',
  height: '8px',
  backgroundColor: '#000',
  borderRadius: '50%',
  position: 'absolute',
  top: '10px',
  left: `${leftOffset}px`
});
  return eye;
};

const eyeLeft = createEye(10);
const eyeRight = createEye(22);
face.appendChild(eyeLeft);
face.appendChild(eyeRight);

// Assemble character
character.appendChild(face);
container.appendChild(character);

// Add background level with textures and colors for depth
const level = document.createElement('div');
Object.assign(level.style, {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  backgroundImage: 'url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
  backgroundSize: 'cover',
  opacity: '0.3',
  zIndex: '-1'
});
container.appendChild(level);

// Optional: Add interactive elements, tooltips, or animations to enhance learning and engagement.