// main.js
// JavaScript logic for urine output categorization and visualization

// Define urine output thresholds for categories (in milliliters per hour)
const thresholds = {
  low: 200,
  high: 600
};

// Example of generating random urine output data for astronauts
const astronauts = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Astronaut ${i + 1}`,
  urineOutput: 0,
  category: "" // low, normal, high
}));

let urineData = [];
let currentScore = 0;
let urineChart = null;

// Categorize urine output based on thresholds
function categorizeUrineOutput(output) {
  if (output < thresholds.low) {
    return 'low';
  } else if (output > thresholds.high) {
    return 'high';
  } else {
    return 'normal';
  }
}

// Generate new urine output data
function generateUrineOutputs() {
  astronauts.forEach(astronaut => {
    // Simulate urine output between 100 and 800 ml
    astronaut.urineOutput = Math.floor(Math.random() * 700) + 100;
    astronaut.category = categorizeUrineOutput(astronaut.urineOutput);
  });
  updateUrineChart();
}

// Initialize chart
function initializeChart() {
  const ctx = document.getElementById('urineChart').getContext('2d');
  urineChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: astronauts.map(a => a.name),
      datasets: [{
        label: 'Urine Output (ml)',
        data: astronauts.map(a => a.urineOutput),
        backgroundColor: astronauts.map(a => {
          if (a.category === 'low') return '#e74c3c'; // red
          if (a.category === 'high') return '#3498db'; // blue
          return '#2ecc71'; // green
        }),
        borderColor: '#fff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 1000
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(tooltipItem) {
              const index = tooltipItem.dataIndex;
              const astronaut = astronauts[index];
              return `${astronaut.name}: ${astronaut.urineOutput} ml (${astronaut.category})`;
            }
          }
        }
      }
    }
  });
}

// Update chart with new data
function updateUrineChart() {
  urineChart.data.datasets[0].data = astronauts.map(a => a.urineOutput);
  urineChart.data.datasets[0].backgroundColor = astronauts.map(a => {
    if (a.category === 'low') return '#e74c3c';
    if (a.category === 'high') return '#3498db';
    return '#2ecc71';
  });
  urineChart.update();
}

// Handle Start Monitoring button
document.getElementById('startBtn').addEventListener('click', () => {
  generateUrineOutputs();
});

// Handle Form Groups button
document.getElementById('groupBtn').addEventListener('click', () => {
  // Form groups based on categories
  const lowGroup = astronauts.filter(a => a.category === 'low');
  const normalGroup = astronauts.filter(a => a.category === 'normal');
  const highGroup = astronauts.filter(a => a.category === 'high');

  // Display group info
  alert(`Low output: ${lowGroup.length} astronauts\n` +
        `Normal output: ${normalGroup.length} astronauts\n` +
        `High output: ${highGroup.length} astronauts`);
});

// Initialize everything
window.onload = () => {
  initializeChart();
  generateUrineOutputs();
};
