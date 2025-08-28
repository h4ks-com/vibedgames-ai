// Initialize resource folders on load
document.addEventListener('DOMContentLoaded', () => {
  const resourceFoldersUl = document.getElementById('resourceFolders');
  const nodeListUl = document.getElementById('nodeList');

  document.getElementById('addFolder').addEventListener('click', () => {
    const folderName = prompt('Enter new folder name:');
    if (folderName) {
      const li = document.createElement('li');
      li.textContent = folderName;
      resourceFoldersUl.appendChild(li);
    }
  });

  document.getElementById('createNode').addEventListener('click', () => {
    const nodeName = prompt('Enter node name:');
    if (nodeName) {
      const li = document.createElement('li');
      li.textContent = nodeName;
      nodeListUl.appendChild(li);
    }
  });

  document.getElementById('runCode').addEventListener('click', () => {
    const code = document.getElementById('vibeEditor').value;
    // Simple placeholder for code execution / validation
    document.getElementById('codeFeedback').textContent = 'Vibe code executed. Infrastructure updated.';
    // Update metrics as placeholder
    document.getElementById('neuralActivity').textContent = Math.floor(Math.random() * 100);
    document.getElementById('resourceLoad').textContent = Math.floor(Math.random() * 50);
  });

document.getElementById('simulate').addEventListener('click', () => {
  // Simulate neural activity and infrastructure status
  document.getElementById('neuralActivity').textContent = Math.floor(Math.random() * 100);
  document.getElementById('resourceLoad').textContent = Math.floor(Math.random() * 100);
  document.getElementById('infrastructureStatus').textContent = 'Healthy';
});

// Show workspace when starting simulation
document.getElementById('startSimulation').addEventListener('click', () => {
  document.getElementById('workspace').style.display = 'flex';
});
