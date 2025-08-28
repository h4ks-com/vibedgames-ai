const astronauts = [];
const numAstronauts = 6;
let score = 0;
let urineInterval;
const scoreDisplay = document.getElementById('score');
const astronautsDiv = document.getElementById('astronauts');
const startBtn = document.getElementById('start-btn');
const groupBtn = document.getElementById('group-btn');

// Initialize astronauts with detailed info and styled avatars
function initAstronauts() {
  for(let i=1; i<=numAstronauts; i++) {
    const div = document.createElement('div');
    div.className = 'astronaut';
    // Create a styled avatar for astronaut
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    // Assign random role, age, gender
    const role = ['Engineer','Scientist','Pilot'][Math.floor(Math.random()*3)];
    const age = Math.floor(Math.random()*30)+30;
    const gender = Math.random() > 0.5 ? 'Male' : 'Female';
    div.innerHTML = `
    <h3>Astronaut ${i}</h3>
    <p class="role">Role: ${role}</p>
    <p class="age">Age: ${age}</p>
    <p class="gender">Gender: ${gender}</p>
    <p>Urine Output: <span class='urine'>0</span> mL</p>`;
    // Style avatar based on gender
    avatar.innerHTML = `<div class='avatar-image'></div>`;
    div.appendChild(avatar);
    // Append to main container
    astronautsDiv.appendChild(div);
    astronauts.push({id:i, urine:0, element:div});
  }
}

// Simulate urine output with enhanced visuals
function simulateUrine() {
  astronauts.forEach(a => {
    const delta = Math.random() * 10;
    a.urine += 20 + delta;
    a.element.querySelector('.urine').textContent = a.urine.toFixed(1);
    // Change background based on urine level with gradient
    if(a.urine > 100) {
      a.element.classList.add('high-urine');
      score -=1;
    } else {
      a.element.classList.remove('high-urine');
    }
  });
  updateScore();
}

// Update score display
function updateScore() {
  scoreDisplay.textContent = 'Score: ' + score;
}

// Group astronauts based on urine levels with visual feedback
function formGroups() {
  astronauts.sort((a,b) => a.urine - b.urine);
  const groups = [];
  let currentGroup = [astronauts[0]];
  for(let i=1; i<astronauts.length; i++) {
    if(Math.abs(astronauts[i].urine - currentGroup[currentGroup.length-1].urine) <= 20) {
      currentGroup.push(astronauts[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [astronauts[i]];
    }
  }
  groups.push(currentGroup);
  // Increase score for proper grouping
  score += Math.max(0, groups.length - 2);
  updateScore();
  alert(`Formed ${groups.length} groups`);
}

// Event listeners
startBtn.onclick = () => {
  if(urineInterval) clearInterval(urineInterval);
  astronauts.length=0;
  astronautsDiv.innerHTML='';
  initAstronauts();
  urineInterval = setInterval(simulateUrine, 1000);
};

groupBtn.onclick = () => {
  formGroups();
};

// Chart.js visualization setup with enhanced textures and colors
const ctx = document.getElementById('urineChart').getContext('2d');
const urineChart = new Chart(ctx, {
  type:'line',
  data: {
    labels: [],
    datasets: astronauts.map((a,i) => ({
      label: 'Astronaut '+a.id,
      data: [],
      borderColor: `hsl(${i*60}, 70%, 50%)`,
      backgroundColor: 'rgba(255,255,255,0.2)',
      tension: 0.4,
      pointBackgroundColor: `hsl(${i*60}, 70%, 70%)`,
      fill: false
    }))
  },
  options: {
    responsive:true,
    animation:false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 20, padding: 15, font: { size: 14, weight: 'bold' } } },
      tooltip: { backgroundColor: '#222', titleColor: '#fff', bodyColor: '#ddd' }
    },
    scales: {
      y: {beginAtZero:true, max:150, grid: { color: 'rgba(255,255,255,0.1)', tickColor: '#fff' } },
      x: { grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  }
});

// Periodically update chart with astronaut urine data
setInterval(() => {
  if(astronauts.length===0) return;
  const labels = urineChart.data.labels;
  if(labels.length>20) {
    labels.shift();
    urineChart.data.datasets.forEach(d => d.data.shift());
  }
  labels.push(new Date().toLocaleTimeString());
  urineChart.data.datasets.forEach((d,i) => {
    d.data.push(astronauts[i].urine);
  });
  urineChart.update();
}, 1000);