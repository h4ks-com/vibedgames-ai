let scene, camera, renderer, clock;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false;
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let prevTime = performance.now();
let objects = [], enemies = [], bullets = [];
let raycaster = new THREE.Raycaster();
let score = 0;
let health = 100;

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Floor
  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  scene.add(floor);
  objects.push(floor);

  // Walls
  const wallGeo = new THREE.BoxGeometry(4, 2.5, 0.2);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const wall1 = new THREE.Mesh(wallGeo, wallMat);
  wall1.position.set(0,1.25,-5);
  wall1.castShadow = true;
  scene.add(wall1);
  objects.push(wall1);

  const wall2 = wall1.clone();
  wall2.position.set(0,1.25,5);
  scene.add(wall2);
  objects.push(wall2);

  const wall3 = new THREE.Mesh(new THREE.BoxGeometry(0.2,2.5,10), wallMat);
  wall3.position.set(-5,1.25,0);
  wall3.castShadow = true;
  scene.add(wall3);
  objects.push(wall3);

  const wall4 = wall3.clone();
  wall4.position.set(5,1.25,0);
  scene.add(wall4);
  objects.push(wall4);

  // Enemies
  for (let i=0; i<5; i++) {
    const enemyGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const enemyMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const enemy = new THREE.Mesh(enemyGeo, enemyMat);
    enemy.position.set(Math.random() * 8 - 4, 0.3, Math.random() * 8 - 4);
    enemy.health = 3;
    scene.add(enemy);
    enemies.push(enemy);
  }

  // Controls
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mousedown', onMouseDown);
  window.addEventListener('resize', onWindowResize);

  // Pointer lock
  document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === document.body) {
      document.addEventListener('mousemove', onMouseMove, false);
    } else {
      document.removeEventListener('mousemove', onMouseMove, false);
    }
  });

  clock = new THREE.Clock();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(e) {
  switch(e.code) {
    case 'KeyW': moveForward = true; break;
    case 'KeyS': moveBackward = true; break;
    case 'KeyA': moveLeft = true; break;
    case 'KeyD': moveRight = true; break;
    case 'Space': if (canJump) { velocity.y += 5; canJump = false; } break;
  }
}

function onKeyUp(e) {
  switch(e.code) {
    case 'KeyW': moveForward = false; break;
    case 'KeyS': moveBackward = false; break;
    case 'KeyA': moveLeft = false; break;
    case 'KeyD': moveRight = false; break;
  }
}

let pitch = 0;
let yaw = 0;

function onMouseMove(e) {
  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
  camera.rotation.x = pitch;
  camera.rotation.y = yaw;
}

function onMouseDown(e) {
  shoot();
}

function shoot() {
  const origin = new THREE.Vector3();
  origin.copy(camera.position);
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  const beam = new THREE.Raycaster(origin, direction);
  const intersects = beam.intersectObjects(enemies, false);
  if (intersects.length > 0) {
    const enemy = intersects[0].object;
    enemy.health -= 1;
    if (enemy.health <= 0) {
      scene.remove(enemy);
      enemies.splice(enemies.indexOf(enemy),1);
      score += 1;
      document.getElementById('score').innerText = 'Score: ' + score;
    } else {
      enemy.material.color.setHex(0xff5555);
    }
  }
  // Visual impact
  const hitPoint = intersects.length > 0 ? intersects[0].point : origin.clone().add(direction.multiplyScalar(100));
  createImpact(hitPoint);

  // Play sound (optional, omitted for brevity)
}

function createImpact(position) {
  const impactGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const impactMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
  const impactMesh = new THREE.Mesh(impactGeo, impactMat);
  impactMesh.position.copy(position);
  scene.add(impactMesh);
  setTimeout(() => { scene.remove(impactMesh); }, 300);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = performance.now();

  // Movement
  velocity.x -= velocity.x * 10.0 * delta;
  velocity.z -= velocity.z * 10.0 * delta;
  velocity.y -= 9.8 * delta;

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  if (moveForward || moveBackward) {
    velocity.z -= direction.z * 50.0 * delta;
  }
  if (moveLeft || moveRight) {
    velocity.x -= direction.x * 50.0 * delta;
  }

  // Update position
  const prevPosition = camera.position.clone();
  camera.position.x += velocity.x * delta;
  camera.position.y += velocity.y * delta;
  camera.position.z += velocity.z * delta;

  // Simple ground collision
  if (camera.position.y < 1.6) {
    velocity.y = 0;
    camera.position.y = 1.6;
    canJump = true;
  }

  // Collisions with environment
  for (let obj of objects) {
    const box = new THREE.Box3().setFromObject(obj);
    if (box.containsPoint(camera.position)) {
      camera.position.copy(prevPosition);
      break;
    }
  }

  // Enemy AI (simple static or random move can be added)
  // Placeholder for advanced behaviors

  renderer.render(scene, camera);
}

// Update on resize
window.addEventListener('resize', onWindowResize);

// Optional: Display HUD updated periodically
// for this prototype, the score and health are static and only updated on events

// Additional features like health bar, spawn more enemies, game over condition, etc., can be added.

// End of main.js