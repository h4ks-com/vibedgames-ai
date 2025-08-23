// Initialize the scene, camera, and renderer
let scene, camera, renderer;
let player, controls;
let bullets = [];
let enemies = [];
let keys = {};
let shootCooldown = false;

init();
animate();

function init() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x202020);

  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('gameContainer').appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);

  // Player setup
  player = {
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    canJump: false,
    health: 100,
    maxHealth: 100,
    ammo: 30,
    maxAmmo: 30,
  };

  // Floor
  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Sample environment
  const boxGeometry = new THREE.BoxGeometry(1, 2, 1);
  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  for (let i = 0; i < 20; i++) {
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(
      (Math.random() - 0.5) * 50,
      1,
      (Math.random() - 0.5) * 50
    );
    scene.add(box);
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Keyboard controls
  document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
  });
  document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
  });

  // Mouse look controls
  document.addEventListener('mousemove', (event) => {
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    camera.rotation.y -= movementX * 0.002;
    camera.rotation.x -= movementY * 0.002;
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
  });

  // Shooting
  document.addEventListener('mousedown', () => {
    shoot();
  });
}

function shoot() {
  if (player.ammo > 0 && !shootCooldown) {
    shootCooldown = true;
    setTimeout(() => { shootCooldown = false; }, 300); // fire rate
    player.ammo--;
    // Create a bullet
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.position.copy(camera.position);
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    bullet.userData = { direction };
    scene.add(bullet);
    bullets.push(bullet);
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = 0.016;
  updatePlayer(delta);
  updateBullets(delta);
  renderer.render(scene, camera);
}

function updatePlayer(delta) {
  // Movement
  const speed = 5;
  player.velocity.x -= player.velocity.x * 10.0 * delta;
  player.velocity.z -= player.velocity.z * 10.0 * delta;

  if (keys['KeyW']) player.velocity.z -= speed * delta;
  if (keys['KeyS']) player.velocity.z += speed * delta;
  if (keys['KeyA']) player.velocity.x -= speed * delta;
  if (keys['KeyD']) player.velocity.x += speed * delta;

  // Jump
  if (keys['Space'] && player.canJump) {
    player.velocity.y += 5;
    player.canJump = false;
  }

  // Gravity
  player.velocity.y -= 9.8 * delta;

  // Apply movement
  const move = new THREE.Vector3(
    player.velocity.x * delta,
    player.velocity.y * delta,
    player.velocity.z * delta
  );

  camera.position.add(move);

  // Simple ground collision
  if (camera.position.y < 1.5) {
    camera.position.y = 1.5;
    player.velocity.y = 0;
    player.canJump = true;
  }
}

function updateBullets(delta) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.position.add(bullet.userData.direction.clone().multiplyScalar(50 * delta));
    // Remove bullets out of range
    if (bullet.position.distanceTo(camera.position) > 100) {
      scene.remove(bullet);
      bullets.splice(i, 1);
    }
  }
}

// Scan for enemy hit (for demo, not implemented)
// You can expand to include enemies, health, AI, etc.