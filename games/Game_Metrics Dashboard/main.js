// Note: Make sure you include Chart.js library in your HTML before this script
// e.g., <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

const ctx = document.getElementById('metricChart').getContext('2d');
let chart;
let ws;
let dataBuffer = [];
let isPaused = false;
let selectedMetric = 'playerHealth';

function initializeChart() {
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Game Metric: ' + selectedMetric,
                data: [],
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            animation: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (seconds)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Value'
                    }
                }
            }
        }
    });
}

function connectWebSocket() {
    ws = new WebSocket('wss://example.com/game-metrics'); // Replace with your actual URL
    ws.onopen = () => {
        document.getElementById('status').textContent = 'Connected';
        console.log('WebSocket connected');
    };
    ws.onmessage = (event) => {
        const metricData = JSON.parse(event.data);
        if (metricData.metric === selectedMetric) {
            if (!isPaused) {
                updateDataBuffer(metricData);
                updateChart();
            }
        }
    };
    ws.onclose = () => {
        document.getElementById('status').textContent = 'Disconnected';
        console.log('WebSocket disconnected');
        setTimeout(connectWebSocket, 3000); // Attempt reconnection
    };
    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
    };
}

function updateDataBuffer(metricData) {
    const currentTime = Date.now() / 1000;
    dataBuffer.push({ x: currentTime, y: metricData.value });
    const cutoff = currentTime - parseInt(document.getElementById('timeRange').value);
    dataBuffer = dataBuffer.filter(point => point.x >= cutoff);
}

function updateChart() {
    if (chart) {
        const startTime = dataBuffer.length > 0 ? dataBuffer[0].x : 0;
        chart.data.labels = dataBuffer.map(pt => Math.round(pt.x - startTime));
        chart.data.datasets[0].data = dataBuffer.map(pt => pt.y);
        chart.data.datasets[0].label = 'Game Metric: ' + selectedMetric;
        chart.update();
    }
}

function setupControls() {
    document.getElementById('pauseBtn').addEventListener('click', () => {
        isPaused = true;
    });
    document.getElementById('resumeBtn').addEventListener('click', () => {
        isPaused = false;
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
        dataBuffer = [];
        updateChart();
    });
    document.getElementById('metricSelect').addEventListener('change', (e) => {
        selectedMetric = e.target.value;
        dataBuffer = [];
        chart.data.datasets[0].label = 'Game Metric: ' + selectedMetric;
        updateChart();
    });
    document.getElementById('timeRange').addEventListener('input', () => {
        // Data trimming handled during updates
    });
}

function init() {
    initializeChart();
    setupControls();
    connectWebSocket();
}

// Initialize the app
window.onload = init;