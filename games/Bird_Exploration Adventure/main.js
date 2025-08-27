// Import Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/js/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky color

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 50, 150);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Controls for camera manipulation
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0,50,0);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Add directional sun light
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(100, 200, 100);
scene.add(sunLight);

// Generate dynamic landscape (terrain)
const terrainSize = 2000;
const terrainSegments = 256;
const terrainGeometry = new THREE.PlaneBufferGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
const positionAttribute = terrainGeometry.attributes.position;

// Displace vertices for terrain elevation
for (let i = 0; i < positionAttribute.count; i++) {
  let x = positionAttribute.getX(i);
  let y = positionAttribute.getY(i);
  // Use Perlin noise or sine functions for realistic terrain
  const elevation = Math.sin(x * 0.1) + Math.cos(y * 0.1) + Math.random() * 0.5;
  positionAttribute.setZ(i, elevation * 20);
}
terrainGeometry.computeVertexNormals();

const terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrainMesh.rotation.x = -Math.PI / 2;
scene.add(terrainMesh);

// Create a flying bird (placeholder)
const birdGeometry = new THREE.SphereGeometry(2, 16, 16);
const birdMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
const bird = new THREE.Mesh(birdGeometry, birdMaterial);
bird.position.set(0, 50, 0);
scene.add(bird);

// Add simple scenic elements (trees/rocks)
function createTree(x, y, z) {
  const trunkGeom = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const trunk = new THREE.Mesh(trunkGeom, trunkMat);
  trunk.position.set(x, y + 2, z);
  scene.add(trunk);

  const leavesGeom = new THREE.SphereGeometry(2, 12, 12);
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x006400 });
  const leaves = new THREE.Mesh(leavesGeom, leavesMat);
  leaves.position.set(x, y + 5, z);
  scene.add(leaves);
}

// Scatter some trees across landscape
for (let i = 0; i < 50; i++) {
  const x = (Math.random() - 0.5) * terrainSize;
  const y = 0; // rough estimate for ground height
  const z = (Math.random() - 0.5) * terrainSize;
  createTree(x, y, z);
}

// Animate scene
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  // Optional: animate bird or add flying mechanics
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();