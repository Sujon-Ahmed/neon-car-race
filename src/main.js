import * as THREE from 'three';
import {
  initAudio,
  playCrash,
  playLaneChange,
  setEnginePitch,
  startEngine,
  stopEngine,
  toggleMute,
} from './audio.js';
import './style.css';

// 1. Find the app container
const app = document.querySelector('#app');

// The canvas follows the app box (100dvh), not the browser window
function viewportSize() {
  return {
    width: app.clientWidth || window.innerWidth,
    height: app.clientHeight || window.innerHeight,
  };
}

const initialViewport = viewportSize();

// 2. Create the 3D world
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1220);
scene.fog = new THREE.Fog(0x0b1220, 20, 70);

// 3. Create the camera
const camera = new THREE.PerspectiveCamera(
  60,
  initialViewport.width / initialViewport.height,
  0.1,
  120
);

camera.position.set(0, 6, 10);
camera.lookAt(0, 0, 0);

// 4. Create the renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setSize(initialViewport.width, initialViewport.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

app.appendChild(renderer.domElement);

// 5. Add lights
const ambientLight = new THREE.AmbientLight(0x9fd7ff, 0.7);
scene.add(ambientLight);

const skyLight = new THREE.HemisphereLight(0x2a4a6b, 0x070b12, 0.9);
scene.add(skyLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
sunLight.position.set(8, 16, 8);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -18;
sunLight.shadow.camera.right = 18;
sunLight.shadow.camera.top = 18;
sunLight.shadow.camera.bottom = -18;
sunLight.shadow.camera.far = 60;
sunLight.shadow.bias = -0.0006;
scene.add(sunLight);

// Neon accents that tint the road and the cars
const cyanLight = new THREE.PointLight(0x42e8f5, 70, 40, 2);
cyanLight.position.set(-7, 4, -6);
scene.add(cyanLight);

const redLight = new THREE.PointLight(0xff3b6b, 50, 34, 2);
redLight.position.set(7, 4, -16);
scene.add(redLight);

// 6. Create the ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({
    color: 0x0e1521,
    roughness: 0.95,
    metalness: 0.1,
  })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
ground.position.z = -30;
ground.receiveShadow = true;
scene.add(ground);

// Faint grid so the world does not read as an empty void
const grid = new THREE.GridHelper(180, 60, 0x1b3a4a, 0x142330);
grid.position.set(0, -0.09, -30);
grid.material.transparent = true;
grid.material.opacity = 0.5;
scene.add(grid);

// 7. Create the road
const road = new THREE.Mesh(
  new THREE.BoxGeometry(8, 0.2, 45),
  new THREE.MeshStandardMaterial({
    color: 0x232d3b,
    roughness: 0.7,
    metalness: 0.25,
  })
);

road.position.set(0, 0, -12);
road.receiveShadow = true;
scene.add(road);

// Neon curbs along both edges
const curbMaterial = new THREE.MeshStandardMaterial({
  color: 0x111b26,
  roughness: 0.5,
  metalness: 0.4,
});

const curbGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0x42e8f5,
});

for (const x of [-4.18, 4.18]) {
  const curb = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.18, 45),
    curbMaterial
  );

  curb.position.set(x, 0.04, -12);
  curb.receiveShadow = true;
  scene.add(curb);

  const curbGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.04, 45),
    curbGlowMaterial
  );

  curbGlow.position.set(x, 0.14, -12);
  scene.add(curbGlow);
}

// 8. Create reusable lane markings
const laneMaterial = new THREE.MeshBasicMaterial({
  color: 0x42e8f5,
});

const laneMarkings = [];
const markingSpacing = 4;
const markingCount = 11;

for (const x of [-1.33, 1.33]) {
  for (let i = 0; i < markingCount; i++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.025, 1.8),
      laneMaterial
    );

    line.position.set(
      x,
      0.115,
      8 - i * markingSpacing
    );

    scene.add(line);
    laneMarkings.push(line);
  }
}

// Neon pylons streaming past on both sides of the road
const pylons = [];
const pylonSpacing = 12;
const pylonCount = 7;
const pylonRun = pylonSpacing * pylonCount;

const pylonPoleGeometry = new THREE.BoxGeometry(0.14, 3.4, 0.14);
const pylonPoleMaterial = new THREE.MeshStandardMaterial({
  color: 0x16222f,
  roughness: 0.6,
  metalness: 0.5,
});

const pylonGlowGeometry = new THREE.BoxGeometry(0.9, 0.1, 0.9);
const pylonCyanMaterial = new THREE.MeshBasicMaterial({ color: 0x42e8f5 });
const pylonPinkMaterial = new THREE.MeshBasicMaterial({ color: 0xff3b6b });

[-8.5, 8.5].forEach((x, sideIndex) => {
  for (let i = 0; i < pylonCount; i++) {
    const pylon = new THREE.Group();

    const pole = new THREE.Mesh(pylonPoleGeometry, pylonPoleMaterial);
    pole.position.y = 1.7;
    pylon.add(pole);

    const glow = new THREE.Mesh(
      pylonGlowGeometry,
      sideIndex === 0 ? pylonCyanMaterial : pylonPinkMaterial
    );
    glow.position.y = 3.5;
    pylon.add(glow);

    pylon.position.set(x, 0, 6 - i * pylonSpacing);
    scene.add(pylon);
    pylons.push(pylon);
  }
});

// 9. Cars (player + oncoming traffic)
const carGeometries = {
  chassis: new THREE.BoxGeometry(1.2, 0.42, 2.3),
  skirt: new THREE.BoxGeometry(1.28, 0.16, 2.1),
  cabin: new THREE.BoxGeometry(0.95, 0.44, 1.05),
  roof: new THREE.BoxGeometry(0.9, 0.1, 0.85),
  spoiler: new THREE.BoxGeometry(1.15, 0.07, 0.32),
  spoilerSupport: new THREE.BoxGeometry(0.08, 0.22, 0.1),
  headlight: new THREE.BoxGeometry(0.28, 0.1, 0.06),
  taillight: new THREE.BoxGeometry(0.3, 0.1, 0.06),
  wheel: new THREE.CylinderGeometry(0.29, 0.29, 0.24, 18),
};

// Rotated once so the axle runs along X and the wheel can spin on X
carGeometries.wheel.rotateZ(Math.PI / 2);

const carMaterialCache = new Map();

function getCarMaterials(bodyColor, trimColor) {
  const key = `${bodyColor}-${trimColor}`;

  if (carMaterialCache.has(key)) {
    return carMaterialCache.get(key);
  }

  const materials = {
    body: new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.35,
      metalness: 0.55,
    }),
    trim: new THREE.MeshStandardMaterial({
      color: trimColor,
      roughness: 0.6,
      metalness: 0.4,
    }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x102b3d,
      roughness: 0.1,
      metalness: 0.9,
    }),
    headlight: new THREE.MeshStandardMaterial({
      color: 0xd8fff6,
      emissive: 0x9dffe8,
      emissiveIntensity: 2,
    }),
    taillight: new THREE.MeshStandardMaterial({
      color: 0xff3b3b,
      emissive: 0xff2222,
      emissiveIntensity: 2.2,
    }),
    wheel: new THREE.MeshStandardMaterial({
      color: 0x0b0f16,
      roughness: 0.9,
      metalness: 0.1,
    }),
  };

  carMaterialCache.set(key, materials);
  return materials;
}

function createCar(bodyColor = 0x39ff88, trimColor = 0x0e1620) {
  const materials = getCarMaterials(bodyColor, trimColor);
  const car = new THREE.Group();
  const wheels = [];

  const addPart = (geometry, material, x, y, z) => {
    const part = new THREE.Mesh(geometry, material);

    part.position.set(x, y, z);
    part.castShadow = true;
    car.add(part);

    return part;
  };

  // Chassis, side skirts, cabin, roof, rear spoiler
  addPart(carGeometries.chassis, materials.body, 0, 0.58, 0);
  addPart(carGeometries.skirt, materials.trim, 0, 0.38, 0);
  addPart(carGeometries.cabin, materials.glass, 0, 0.99, 0.12);
  addPart(carGeometries.roof, materials.body, 0, 1.23, 0.2);
  addPart(carGeometries.spoiler, materials.trim, 0, 1.0, 1.02);

  for (const x of [-0.42, 0.42]) {
    addPart(carGeometries.spoilerSupport, materials.trim, x, 0.88, 1.02);
  }

  // Headlights face -Z, taillights face the camera
  for (const x of [-0.38, 0.38]) {
    addPart(carGeometries.headlight, materials.headlight, x, 0.66, -1.16);
  }

  for (const x of [-0.42, 0.42]) {
    addPart(carGeometries.taillight, materials.taillight, x, 0.66, 1.16);
  }

  for (const x of [-0.62, 0.62]) {
    for (const z of [-0.72, 0.72]) {
      const wheel = addPart(carGeometries.wheel, materials.wheel, x, 0.29, z);
      wheels.push(wheel);
    }
  }

  return { group: car, wheels };
}

const car = createCar();
const player = car.group;

player.position.set(0, 0.1, 3);
scene.add(player);

// Player movement settings
const lanePositions = [-2.4, 0, 2.4];

let currentLane = 1; // Start in the center lane
const moveSpeed = 12; // Higher means faster movement

function playLaneSound(direction) {
  initAudio();
  startEngine();
  playLaneChange(direction);
}

function changeLane(direction) {
  if (isGameOver) return;

  const nextLane = THREE.MathUtils.clamp(
    currentLane + direction,
    0,
    lanePositions.length - 1
  );

  if (nextLane === currentLane) return;

  currentLane = nextLane;
  playLaneSound(direction);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  if (
    key === 'arrowleft' ||
    key === 'arrowright'
  ) {
    event.preventDefault();
  }

  // Ignore held-down key repeats
  if (event.repeat) return;

  if (key === 'a' || key === 'arrowleft') {
    changeLane(-1);
  }

  if (key === 'd' || key === 'arrowright') {
    changeLane(1);
  }
});

// Touch: swipe left or right anywhere on the screen to change lanes
let swipeStartX = null;

app.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse') return;
  swipeStartX = event.clientX;
});

app.addEventListener('pointerup', (event) => {
  if (swipeStartX === null) return;

  const distanceX = event.clientX - swipeStartX;
  swipeStartX = null;

  if (Math.abs(distanceX) < 24) return;

  changeLane(distanceX < 0 ? -1 : 1);
});

app.addEventListener('pointercancel', () => {
  swipeStartX = null;
});

// Browsers only allow audio after a user gesture
window.addEventListener('pointerdown', () => {
  initAudio();

  if (!isGameOver) {
    startEngine();
  }
}, { once: true });

// 10. Obstacle system (oncoming red cars)
const obstacles = [];

const trafficColors = [0xff3b3b, 0xff5533, 0xff2d6b];
const trafficTrimColor = 0x2a0b12;

const baseSpeed = 12;
const maxSpeed = 22;
let gameSpeed = baseSpeed;
const spawnInterval = 1.4;

let spawnTimer = 0;

function spawnObstacle() {
  // Choose one of the three lanes randomly
  const randomLane = Math.floor(
    Math.random() * lanePositions.length
  );

  const bodyColor = trafficColors[
    Math.floor(Math.random() * trafficColors.length)
  ];

  const { group: obstacle, wheels } = createCar(
    bodyColor,
    trafficTrimColor
  );

  obstacle.position.set(
    lanePositions[randomLane],
    0.1,
    -32
  );

  // Oncoming traffic faces the player
  obstacle.rotation.y = Math.PI;
  obstacle.userData.wheels = wheels;

  scene.add(obstacle);
  obstacles.push(obstacle);
}

// Game state and user interface
let isGameOver = false;
let score = 0;
let topSpeed = 0;

const ui = document.createElement('div');
ui.className = 'hud';

ui.innerHTML = `
  <div class="hud-top">
    <div class="hud-identity">
      <div class="hud-brand">
        <span class="hud-mark"></span>
        <span class="hud-brand-text">Neon Runner</span>
        <span class="hud-tag">Endless Traffic</span>
      </div>

      <a
        class="hud-credit"
        href="https://github.com/Sujon-Ahmed"
        target="_blank"
        rel="noopener noreferrer"
      >
        Developed by Sujon Ahmed
      </a>
    </div>

    <div class="hud-actions">
      <button id="sound-button" class="hud-button" type="button" aria-pressed="false">
        SFX
      </button>

      <div class="hud-score">
        <span class="hud-label">Score</span>
        <span id="score">0</span>
      </div>
    </div>
  </div>

  <div class="hud-speed">
    <div class="gauge">
      <div class="gauge-ring"></div>
      <div class="gauge-core">
        <span id="speed">0</span>
        <span class="hud-speed-unit">km/h</span>
      </div>
    </div>
    <span class="hud-label">Speed</span>
  </div>

  <div class="hud-hint">
    <kbd>&larr;</kbd><kbd>&rarr;</kbd> or <kbd>A</kbd><kbd>D</kbd> to switch lanes
  </div>

  <div class="hud-touch-hint">
    Swipe or press &larr; &rarr;
  </div>

  <div id="game-over" class="game-over hidden">
    <div class="game-over-card">
      <span class="hud-label">Run Complete</span>
      <h2>Race Over</h2>

      <div class="game-over-stats">
        <div class="stat">
          <span class="hud-label">Score</span>
          <span id="final-score">0</span>
        </div>

        <div class="stat">
          <span class="hud-label">Top Speed</span>
          <span>
            <span id="final-speed">0</span><span class="stat-unit">km/h</span>
          </span>
        </div>
      </div>

      <button id="restart-button">Race Again</button>
    </div>
  </div>
`;

app.appendChild(ui);

const scoreElement = ui.querySelector('#score');
const speedElement = ui.querySelector('#speed');
const gaugeRing = ui.querySelector('.gauge-ring');
const soundButton = ui.querySelector('#sound-button');
const gameOverElement = ui.querySelector('#game-over');
const finalScoreElement = ui.querySelector('#final-score');
const finalSpeedElement = ui.querySelector('#final-speed');
const restartButton = ui.querySelector('#restart-button');

function endGame() {
  if (isGameOver) return;

  isGameOver = true;

  playCrash();
  stopEngine();

  finalScoreElement.textContent = Math.floor(score);
  finalSpeedElement.textContent = Math.round(topSpeed);
  gameOverElement.classList.remove('hidden');
}

function restartGame() {
  // Reset the run
  isGameOver = false;
  score = 0;
  topSpeed = 0;
  spawnTimer = 0;
  gameSpeed = baseSpeed;
  currentLane = 1;

  scoreElement.textContent = '0';
  finalScoreElement.textContent = '0';
  finalSpeedElement.textContent = '0';

  // Clear the track
  for (const obstacle of obstacles) {
    scene.remove(obstacle);
  }

  obstacles.length = 0;

  // Put the car back in the center lane
  player.position.set(0, 0.1, 3);
  player.rotation.set(0, 0, 0);

  gameOverElement.classList.add('hidden');

  initAudio();
  startEngine();
  setEnginePitch(0);
}

restartButton.addEventListener('click', restartGame);

soundButton.addEventListener('click', () => {
  initAudio();

  const muted = toggleMute();

  soundButton.classList.toggle('muted', muted);
  soundButton.setAttribute('aria-pressed', String(muted));
  soundButton.textContent = muted ? 'SFX OFF' : 'SFX';
});

function checkCollision(player, obstacle) {
  const distanceX = Math.abs(
    player.position.x - obstacle.position.x
  );

  const distanceY = Math.abs(
    player.position.y - obstacle.position.y
  );

  const distanceZ = Math.abs(
    player.position.z - obstacle.position.z
  );

  // Half-size of both objects combined
  const hitX = 0.62 + 0.45;
  const hitY = 0.7 + 0.5;
  const hitZ = 0.9 + 0.45;

  return (
    distanceX < hitX &&
    distanceY < hitY &&
    distanceZ < hitZ
  );
}

// 11. Endless game animation
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (!isGameOver) {
    // A. Ease the speed up as the run goes on
    gameSpeed = Math.min(maxSpeed, baseSpeed + score * 0.012);

    // B. Smooth lane changes: glide, lean and a touch of steering
    const targetX = lanePositions[currentLane];
    const previousX = player.position.x;

    player.position.x = THREE.MathUtils.damp(
      player.position.x,
      targetX,
      moveSpeed,
      delta
    );

    const lateralVelocity =
      (player.position.x - previousX) / Math.max(delta, 0.001);

    // Lean into the turn
    player.rotation.z = THREE.MathUtils.damp(
      player.rotation.z,
      THREE.MathUtils.clamp(-lateralVelocity * 0.04, -0.12, 0.12),
      6,
      delta
    );

    // Nose points where the car is heading
    player.rotation.y = THREE.MathUtils.damp(
      player.rotation.y,
      THREE.MathUtils.clamp(-lateralVelocity * 0.025, -0.1, 0.1),
      5,
      delta
    );

    // C. Spin the wheels, drive the gauge and the engine note
    const wheelSpin = (gameSpeed * delta) / 0.29;
    const speedKmh = Math.round(gameSpeed * 11);

    for (const wheel of car.wheels) {
      wheel.rotation.x -= wheelSpin;
    }

    speedElement.textContent = speedKmh;
    gaugeRing.style.setProperty(
      '--gauge',
      `${((gameSpeed / maxSpeed) * 240).toFixed(1)}deg`
    );

    if (speedKmh > topSpeed) {
      topSpeed = speedKmh;
    }

    setEnginePitch((gameSpeed - baseSpeed) / (maxSpeed - baseSpeed));

    // D. Move and recycle road markings
    for (const line of laneMarkings) {
      line.position.z += gameSpeed * delta;

      if (line.position.z > 8) {
        line.position.z -= markingSpacing * markingCount;
      }
    }

    // E. Stream the neon pylons past the road
    for (const pylon of pylons) {
      pylon.position.z += gameSpeed * delta;

      if (pylon.position.z > 14) {
        pylon.position.z -= pylonRun;
      }
    }

    // F. Spawn obstacles
    spawnTimer += delta;

    if (spawnTimer >= spawnInterval) {
      spawnObstacle();
      spawnTimer -= spawnInterval;
    }

    // G. Move obstacles and detect collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i];

      obstacle.position.z += gameSpeed * delta;

      for (const wheel of obstacle.userData.wheels) {
        wheel.rotation.x -= wheelSpin;
      }

      if (checkCollision(player, obstacle)) {
        endGame();
        break;
      }

      // Remove obstacles that have passed the player
      if (obstacle.position.z > 12) {
        scene.remove(obstacle);
        obstacles.splice(i, 1);
      }
    }

    // H. Update the survival score
    if (!isGameOver) {
      score += delta * 10;
      scoreElement.textContent = Math.floor(score);
    }
  }

  // Keep rendering even after Game Over
  renderer.render(scene, camera);
}

animate();

// 12. Adjust the game when the window resizes or the phone rotates
window.addEventListener('resize', () => {
  const { width, height } = viewportSize();

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
