import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls, bird;
let clock = new THREE.Clock();

function init() {
  // Scene setup with fog for atmospheric depth
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xaabbbb, 10, 100);

  // Camera setup with adjustable FOV and perspective
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 15, 30);

  // Renderer setup for WebGL with anti-aliasing for smoother visuals
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting system: ambient for general illumination and directional for shadows and highlights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 50, 25);
  scene.add(directionalLight);

  // Procedural terrain with texture, using a repeating pattern for expansive landscape
  const loader = new THREE.TextureLoader();
  const texture = loader.load('https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.1&auto=format&fit=crop&w=1600&q=80');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);

  const terrainGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
  const terrainMaterial = new THREE.MeshLambertMaterial({ map: texture });
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.rotation.x = -Math.PI / 2;
  scene.add(terrain);

  // Bird model: simplified high-poly inspired sphere with potential for detailed feathers
 const birdTextureLoader = new THREE.TextureLoader();
  const birdTexture = birdTextureLoader.load('https://images.unsplash.com/photo-1549924231-f129b911e442?ixlib=rb-4.0.1&auto=format&fit=crop&w=800&q=80');
  const birdGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const birdMaterial = new THREE.MeshStandardMaterial({ map: birdTexture });
  bird = new THREE.Mesh(birdGeometry, birdMaterial);
  bird.position.set(0, 10, 0);
  scene.add(bird);

  // Controls: orbit controls for camera, user can switch to custom controls for flight
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.copy(bird.position);

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Flight control parameters for natural bird flight mechanics
const flightSpeed = 0.1;
const rotationSpeed = 0.02;
let keyStates = {};

window.addEventListener('keydown', (event) => { keyStates[event.code] = true; });
window.addEventListener('keyup', (event) => { keyStates[event.code] = false; });

function handleInput() {
  if (keyStates['KeyW']) {
    // move forward with flight physics
    bird.translateZ(-flightSpeed);
  }
  if (keyStates['KeyS']) {
    // move backward
    bird.translateZ(flightSpeed);
  }
  if (keyStates['KeyA']) {
    // yaw left
    bird.rotation.y += rotationSpeed;
  }
  if (keyStates['KeyD']) {
    // yaw right
    bird.rotation.y -= rotationSpeed;
  }
  if (keyStates['Space']) {
    // ascend
    bird.position.y += flightSpeed;
  }
  if (keyStates['ShiftLeft']) {
    // descend
    bird.position.y -= flightSpeed;
  }
  // Prevent bird from going underground or underwater
  if (bird.position.y < 1) bird.position.y = 1;
}

function animate() {
  requestAnimationFrame(animate);
  handleInput();
  controls.target.copy(bird.position);
  controls.update();
  renderer.render(scene, camera);
}

init();

animate();