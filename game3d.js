import * as THREE from "three";
import { GLTFLoader } from "three/addons/GLTFLoader.js";
import { DRACOLoader } from "three/addons/DRACOLoader.js";
import { MeshoptDecoder } from "three/addons/meshopt_decoder.module.js";

const vehicles = {
  silverado: {
    id: "silverado",
    name: "OVERLAND SILVERADO",
    className: "ADVENTURE CLASS",
    image: "./cars/silverado-front.jpg",
    resultImage: "./cars/silverado-rear.jpg",
    model: "./models/generated/silverado-web.glb",
    maxSpeed: 170,
    acceleration: 42,
    brake: 72,
    handling: 1.25,
    targetLength: 5.5,
    targetWidth: 2.22,
    targetHeight: 2.08,
    wheelBase: 1.72,
    wheelRadius: 0.56,
    wheelFaceX: 1.105,
    wheelVisualRadius: 0.47,
    wheelVisualY: 0.55,
    wheelVisualZ: [-1.72, 1.72],
    color: 0xe7e5db,
    modelRotation: 0,
    rideHeight: 0.025,
    materialBoost: 1.18,
    cameraHeightBias: 0.06,
    cameraDistanceBias: 0.8,
    viewYaw: 0,
    archiveLabel: "ARCHIVE 001 / ADVENTURE",
    ownerInstagram: "@MANDOL_OUTDOORS",
    showroomDistance: 7.6,
    truck: true,
    tripoModel: true,
  },
  clk55: {
    id: "clk55",
    name: "CLK 55 AMG CABRIOLET",
    className: "GRAND TOURER CLASS",
    image: "./cars/clk55-city.jpg",
    resultImage: "./cars/clk55-rear.jpg",
    model: "./models/generated/clk55-web.glb",
    maxSpeed: 240,
    acceleration: 56,
    brake: 84,
    handling: 1.08,
    targetLength: 4.64,
    targetWidth: 1.78,
    targetHeight: 1.38,
    wheelBase: 1.38,
    wheelRadius: 0.42,
    wheelFaceX: 0.895,
    wheelVisualRadius: 0.355,
    wheelVisualY: 0.41,
    wheelVisualZ: [-1.38, 1.38],
    color: 0xa66f53,
    modelRotation: 0,
    rideHeight: 0.012,
    materialBoost: 1.42,
    cameraHeightBias: 0.08,
    cameraDistanceBias: 1.15,
    viewYaw: 0,
    archiveLabel: "ARCHIVE 002 / GRAND TOURER",
    ownerInstagram: "@OWNER_TO_BE_CONFIRMED",
    showroomDistance: 6.7,
    truck: false,
    tripoModel: true,
  },
};

// The collection is intentionally modeled as 45 stable archive slots. As new
// book vehicles receive GLB files, filling a slot automatically makes that car
// eligible for showroom selection and NPC traffic without rewriting the race.
const collectionCatalog = Array.from({ length: 45 }, function (_, index) {
  if (index === 0) return { slot: 1, vehicleId: "silverado", status: "active" };
  if (index === 1) return { slot: 2, vehicleId: "clk55", status: "active" };
  return { slot: index + 1, vehicleId: null, status: "awaiting-model" };
});

const maps = {
  city: {
    id: "city",
    name: "NEON CITY CIRCUIT",
    distance: 2400,
    timeLimit: 64,
    pages: [440, 970, 1510, 2070],
    pageLanes: [-1, 1, 0, -1],
    sky: 0x030914,
    fog: 0x0b1525,
    fogDensity: 0.0047,
    road: 0x151c25,
    shoulder: 0x0b121a,
    line: 0xbdefff,
    accent: 0x68e1ff,
    traffic: 11,
    scenery: "city",
    backdrop: "./maps/neon-city-photo-v1.jpg",
  },
  canyon: {
    id: "canyon",
    name: "RED ROCK EXPEDITION",
    distance: 2800,
    timeLimit: 70,
    pages: [510, 1120, 1800, 2470],
    pageLanes: [1, -1, 0, 1],
    sky: 0xc98255,
    fog: 0x8d6750,
    fogDensity: 0.00305,
    road: 0x211c1b,
    shoulder: 0x694433,
    line: 0xffe7c0,
    accent: 0xff7152,
    traffic: 7,
    scenery: "canyon",
    backdrop: "./maps/red-rock-cinematic-v36.jpg",
  },
  forest: {
    id: "forest",
    name: "ALPINE INK RUN",
    distance: 2600,
    timeLimit: 72,
    pages: [390, 1050, 1720, 2310],
    pageLanes: [0, 1, -1, 0],
    sky: 0x8295a2,
    fog: 0x52636d,
    fogDensity: 0.00365,
    road: 0x162024,
    shoulder: 0x1f3329,
    line: 0xdcefdc,
    accent: 0x91ffc7,
    traffic: 8,
    scenery: "forest",
    backdrop: "./maps/alpine-cinematic-v36.jpg",
  },
};

const mapPresentation = {
  city: { kicker: "NIGHT / ASPHALT", difficulty: "MEDIUM" },
  canyon: { kicker: "SUNSET / DUST", difficulty: "HARD" },
  forest: { kicker: "DAWN / MOUNTAIN", difficulty: "EXPERT" },
};

const modeDefinitions = {
  contract: { label: "CONTRACT", button: "START CONTRACT", timed: true, pages: true },
  endless: { label: "ENDLESS", button: "START SURVIVAL", timed: false, pages: true },
  time_trial: { label: "TIME TRIAL", button: "START TIME TRIAL", timed: true, pages: false },
  collector: { label: "COLLECTOR", button: "START CHALLENGE", timed: true, pages: false },
};

const archiveStories = {
  silverado: "A purpose-built overland truck whose hand-finished accessories turn utility into a personal expedition signature.",
  clk55: "A bronze grand tourer that combines open-air performance, restrained elegance and the unmistakable character of the V8 era.",
};

function readStoredJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

const driverProfile = Object.assign({
  xp: 0,
  stars: 0,
  tokens: Number(localStorage.getItem("tdm-archive-tokens") || 0),
  pages: [],
  photos: [],
  vehicles: [],
  medals: {},
  totalDistance: 0,
  totalNearMisses: 0,
}, readStoredJson("tdm-driver-profile-v46", {}));

const consoleSettings = Object.assign({
  quality: "ultra",
  weather: true,
  shake: true,
  haptics: true,
}, readStoredJson("tdm-console-settings-v46", {}));

function saveDriverProfile() {
  localStorage.setItem("tdm-driver-profile-v46", JSON.stringify(driverProfile));
  localStorage.setItem("tdm-archive-tokens", String(driverProfile.tokens || 0));
}

function saveConsoleSettings() {
  localStorage.setItem("tdm-console-settings-v46", JSON.stringify(consoleSettings));
}

const app = document.getElementById("app");
const screens = {
  home: document.getElementById("homeScreen"),
  vehicle: document.getElementById("vehicleScreen"),
  map: document.getElementById("mapScreen"),
  game: document.getElementById("gameScreen"),
  result: document.getElementById("resultScreen"),
};
const canvas = document.getElementById("gameCanvas");
const countdown = document.getElementById("countdown");
const pausePanel = document.getElementById("pausePanel");
const collectToast = document.getElementById("collectToast");
const howModal = document.getElementById("howModal");
const gamepadStatus = document.getElementById("gamepadStatus");
const modelStatus = document.getElementById("modelStatus");
const driveEffects = document.getElementById("driveEffects");
const showroomCanvas = document.getElementById("showroomCanvas");
const showroomStage = document.getElementById("showroomStage");
const showroomLoading = document.getElementById("showroomLoading");
const showroomName = document.getElementById("showroomName");
const showroomArchive = document.getElementById("showroomArchive");
const showroomOwner = document.getElementById("showroomOwner");
const showroomAutoButton = document.getElementById("showroomAuto");
const archiveRail = document.getElementById("archiveRail");
const archivePosition = document.getElementById("archivePosition");
const routePreview = document.getElementById("routePreview");
const routePreviewKicker = document.getElementById("routePreviewKicker");
const routePreviewTitle = document.getElementById("routePreviewTitle");
const routePreviewMeta = document.getElementById("routePreviewMeta");
const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
const archiveTokenCount = document.getElementById("archiveTokenCount");
const raceButtonLabel = document.querySelector("#raceButton span");
const brandIntro = document.getElementById("brandIntro");
const introSkip = document.getElementById("introSkip");
const archiveModal = document.getElementById("archiveModal");
const settingsModal = document.getElementById("settingsModal");
const archiveStoryGrid = document.getElementById("archiveStoryGrid");
const archivePageGrid = document.getElementById("archivePageGrid");
const worldEventPanel = document.getElementById("worldEvent");
const worldEventLabel = document.getElementById("worldEventLabel");
const weatherBadge = document.getElementById("weatherBadge");

const hud = {
  vehicleImage: document.getElementById("hudVehicleImage"),
  vehicle: document.getElementById("hudVehicle"),
  vehicleClass: document.getElementById("hudClass"),
  map: document.getElementById("hudMap"),
  pages: document.getElementById("pagePips"),
  pageCounter: document.getElementById("pageCounter"),
  progress: document.getElementById("trackProgress"),
  distance: document.getElementById("distanceLabel"),
  time: document.getElementById("timeLabel"),
  speed: document.getElementById("speedLabel"),
  telemetrySpeed: document.getElementById("telemetrySpeed"),
  telemetryScore: document.getElementById("telemetryScore"),
  telemetryMultiplier: document.getElementById("telemetryMultiplier"),
  telemetryDistance: document.getElementById("telemetryDistance"),
  speedBar: document.getElementById("speedBar"),
  gear: document.getElementById("gearLabel"),
  score: document.getElementById("scoreLabel"),
  combo: document.getElementById("comboLabel"),
  difficulty: document.getElementById("difficultyLabel"),
  difficultyProgress: document.getElementById("difficultyProgress"),
  missionKicker: document.getElementById("missionKicker"),
  missionObjective: document.getElementById("missionObjective"),
  missionStatus: document.getElementById("missionStatus"),
  boost: document.getElementById("boostBar"),
  boostLabel: document.getElementById("boostLabel"),
  radar: document.getElementById("trafficRadar"),
  cameraButton: document.getElementById("cameraButton"),
  orbitButton: document.getElementById("orbitButton"),
};

const radarMarkers = Array.from({ length: 10 }, function () {
  const marker = document.createElement("i");
  hud.radar.appendChild(marker);
  return marker;
});

const state = {
  screen: "home",
  vehicle: vehicles[localStorage.getItem("tdm-last-vehicle")] ? localStorage.getItem("tdm-last-vehicle") : "silverado",
  map: maps[localStorage.getItem("tdm-last-map")] ? localStorage.getItem("tdm-last-map") : "city",
  mode: modeDefinitions[localStorage.getItem("tdm-last-mode")] ? localStorage.getItem("tdm-last-mode") : "contract",
  sound: true,
  keys: { left: false, right: false, gas: false, brake: false, boost: false },
  race: null,
  raf: 0,
  gamepadPauseHeld: false,
  gamepadOrbitHeld: false,
  gamepadPhotoHeld: false,
};

const showroom = {
  model: null,
  vehicleId: null,
  yaw: -0.42,
  targetYaw: -0.42,
  autoRotate: true,
  dragging: false,
  pointerX: 0,
  raf: 0,
  lastTime: performance.now(),
  loadToken: 0,
};

let audioContext = null;
let engineOscillator = null;
let engineGain = null;
let engineBassOscillator = null;
let engineBassGain = null;
let windSource = null;
let windGain = null;
let tireGain = null;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  precision: "highp",
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(56, 1, 0.06, 1200);
camera.position.set(0, 2.55, 10.15);

const showroomRenderer = new THREE.WebGLRenderer({
  canvas: showroomCanvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
showroomRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.25));
showroomRenderer.outputColorSpace = THREE.SRGBColorSpace;
showroomRenderer.toneMapping = THREE.ACESFilmicToneMapping;
showroomRenderer.toneMappingExposure = 1.05;
showroomRenderer.shadowMap.enabled = true;
showroomRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
const showroomScene = new THREE.Scene();
const showroomCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
showroomCamera.position.set(0, 2.45, 8.9);
const showroomHemisphere = new THREE.HemisphereLight(0xd7f5ff, 0x111722, 2.7);
const showroomKey = new THREE.DirectionalLight(0xffffff, 4.2);
showroomKey.position.set(-5, 8, 6);
showroomKey.castShadow = true;
showroomKey.shadow.mapSize.set(2048, 2048);
const showroomRim = new THREE.DirectionalLight(0x68e1ff, 3.2);
showroomRim.position.set(7, 3, -5);
const showroomFloor = new THREE.Mesh(
  new THREE.CircleGeometry(6.2, 64),
  new THREE.MeshPhysicalMaterial({
    color: 0x101820,
    roughness: 0.24,
    metalness: 0.5,
    clearcoat: 0.72,
    clearcoatRoughness: 0.2,
    transparent: true,
    opacity: 0.78,
  }),
);
showroomFloor.rotation.x = -Math.PI / 2;
showroomFloor.position.y = -0.035;
showroomFloor.receiveShadow = true;
showroomScene.add(showroomHemisphere, showroomKey, showroomRim, showroomFloor);

const hemisphere = new THREE.HemisphereLight(0xcceeff, 0x111722, 2.25);
scene.add(hemisphere);
const sun = new THREE.DirectionalLight(0xf2f8ff, 3.05);
sun.position.set(-12, 24, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.left = -24;
sun.shadow.camera.right = 24;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -10;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 95;
sun.shadow.bias = -0.00018;
sun.shadow.normalBias = 0.025;
const roadFill = new THREE.DirectionalLight(0x8edcff, 1.25);
roadFill.position.set(10, 7, 8);
const vehicleRim = new THREE.DirectionalLight(0xffb277, 1.1);
vehicleRim.position.set(-8, 4, -10);
scene.add(sun, roadFill, vehicleRim);

const world = new THREE.Group();
const roadWorld = new THREE.Group();
const trafficWorld = new THREE.Group();
const collectibleWorld = new THREE.Group();
const atmosphereWorld = new THREE.Group();
const skyWorld = new THREE.Group();
const eventWorld = new THREE.Group();
world.add(skyWorld, roadWorld, trafficWorld, collectibleWorld, eventWorld, atmosphereWorld);
scene.add(world);

const SEGMENT_LENGTH = 42;
const SEGMENT_COUNT = 24;
const PLAYER_Z = 4;
const LANE_X = [-5.1, 0, 5.1];
const WORLD_SCALE = 0.24;
const roadSegments = [];
const trafficCars = [];
const collectibleCards = [];
const atmosphereLayers = [];
const routeLandmarks = [];
const animatedLandmarkMaterials = [];
let playerCar = null;
let currentMapTheme = null;

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./vendor/draco/gltf/");
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.setMeshoptDecoder(MeshoptDecoder);
const modelCache = new Map();
const trafficModelPrototypes = new Map();
const environmentTextureCache = new Map();
const textureLoader = new THREE.TextureLoader();
let cityFacadeTexture = null;
let pineTexture = null;
let scotsPineTexture = null;
let redRockTexture = null;
let asphaltTexture = null;
let asphaltReliefTexture = null;
let asphaltUltraTexture = null;
let asphaltUltraReliefTexture = null;
let canyonRockTexture = null;
let canyonRockReliefTexture = null;
let forestFloorTexture = null;
let forestFloorReliefTexture = null;
let alpineGraniteTexture = null;
let alpineGraniteReliefTexture = null;
let softParticleTexture = null;
let activeSkyMaterial = null;
const sceneryMaterials = new Map();

function createEvergreenCrownGeometry(seed) {
  const profile = [];
  const rings = 15;
  for (let ring = 0; ring <= rings; ring += 1) {
    const t = ring / rings;
    const taper = Math.pow(1 - t, 0.72);
    const tier = ring % 2 === 0 ? 1.08 : 0.82;
    const radius = Math.max(0.018, taper * tier * (0.96 + Math.sin(seed * 1.7 + ring * 1.91) * 0.055));
    profile.push(new THREE.Vector2(radius, t - 0.5));
  }
  const geometry = new THREE.LatheGeometry(profile, 20);
  const position = geometry.attributes.position;
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const x = position.getX(vertex);
    const y = position.getY(vertex);
    const z = position.getZ(vertex);
    const angle = Math.atan2(z, x);
    const irregularity = 1
      + Math.sin(angle * 5 + y * 8 + seed * 2.4) * 0.045
      + Math.sin(angle * 11 - y * 17 + seed) * 0.025;
    position.setX(vertex, x * irregularity);
    position.setZ(vertex, z * irregularity);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function createMountainGeometry(seed) {
  const geometry = new THREE.ConeGeometry(1, 1, 22, 7, false);
  const position = geometry.attributes.position;
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const x = position.getX(vertex);
    const y = position.getY(vertex);
    const z = position.getZ(vertex);
    const angle = Math.atan2(z, x);
    const height = y + 0.5;
    const weathering = 1
      + Math.sin(angle * 3 + seed * 1.8 + height * 8) * 0.11
      + Math.sin(angle * 7 - seed + height * 15) * 0.055;
    position.setX(vertex, x * weathering);
    position.setZ(vertex, z * weathering);
    position.setY(vertex, y + Math.sin(angle * 5 + seed) * (1 - height) * 0.035);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function createMesaGeometry(seed) {
  const rings = [
    [1.0, -0.5], [1.04, -0.42], [0.92, -0.34], [0.88, -0.18],
    [0.76, -0.12], [0.72, 0.04], [0.64, 0.1], [0.6, 0.26],
    [0.48, 0.32], [0.45, 0.43], [0.36, 0.5],
  ];
  const segments = 18;
  const vertices = [];
  const uvs = [];
  const indices = [];
  rings.forEach(function (ring, ringIndex) {
    const heightRatio = ringIndex / (rings.length - 1);
    const centerX = Math.sin(seed * 2.1 + ringIndex * 0.71) * 0.08 * heightRatio;
    const centerZ = Math.cos(seed * 1.6 + ringIndex * 0.58) * 0.07 * heightRatio;
    for (let segment = 0; segment < segments; segment += 1) {
      const angle = segment / segments * Math.PI * 2;
      const weathering = 1
        + Math.sin(angle * 3 + seed * 1.8 + ringIndex * 0.47) * 0.095
        + Math.sin(angle * 7 - seed * 0.9 + ringIndex * 0.29) * 0.045;
      vertices.push(
        centerX + Math.cos(angle) * ring[0] * weathering,
        ring[1],
        centerZ + Math.sin(angle) * ring[0] * weathering,
      );
      uvs.push(segment / segments, heightRatio);
    }
  });
  for (let ringIndex = 0; ringIndex < rings.length - 1; ringIndex += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const nextSegment = (segment + 1) % segments;
      const lower = ringIndex * segments + segment;
      const lowerNext = ringIndex * segments + nextSegment;
      const upper = (ringIndex + 1) * segments + segment;
      const upperNext = (ringIndex + 1) * segments + nextSegment;
      indices.push(lower, upper, lowerNext, lowerNext, upper, upperNext);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const sceneryGeometry = {
  cube: new THREE.BoxGeometry(1, 1, 1),
  rock: new THREE.IcosahedronGeometry(1, 2),
  cliff: new THREE.IcosahedronGeometry(1, 3),
  shrub: new THREE.DodecahedronGeometry(0.5, 0),
  mesa: new THREE.CylinderGeometry(0.72, 1, 1, 12),
  trunk: new THREE.CylinderGeometry(0.1, 0.16, 1, 7),
  pineCone: new THREE.ConeGeometry(0.5, 1, 14),
  pinePlane: new THREE.PlaneGeometry(1, 1),
  evergreenCrowns: [
    createEvergreenCrownGeometry(1),
    createEvergreenCrownGeometry(2),
    createEvergreenCrownGeometry(3),
  ],
  mountains: [
    createMountainGeometry(1),
    createMountainGeometry(2),
    createMountainGeometry(3),
  ],
  mesaFormations: [
    createMesaGeometry(1),
    createMesaGeometry(2),
    createMesaGeometry(3),
  ],
};

function showScreen(name) {
  state.screen = name;
  Object.entries(screens).forEach(function (entry) {
    entry[1].classList.toggle("active", entry[0] === name);
  });
  screens[name].scrollTop = 0;
  app.classList.toggle("racing", name === "game");
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  if (name === "game") resizeRenderer();
  if (name === "vehicle") {
    requestAnimationFrame(function () {
      resizeShowroom();
      loadShowroomVehicle(state.vehicle);
    });
  }
}

function openHow() {
  howModal.classList.add("show");
  howModal.setAttribute("aria-hidden", "false");
}

function closeHow() {
  howModal.classList.remove("show");
  howModal.setAttribute("aria-hidden", "true");
}

function initAudio() {
  if (!state.sound || audioContext) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  audioContext = new AudioCtx();
  engineOscillator = audioContext.createOscillator();
  engineGain = audioContext.createGain();
  engineOscillator.type = "sawtooth";
  engineOscillator.frequency.value = 58;
  engineGain.gain.value = 0;
  engineOscillator.connect(engineGain).connect(audioContext.destination);
  engineOscillator.start();

  engineBassOscillator = audioContext.createOscillator();
  engineBassGain = audioContext.createGain();
  engineBassOscillator.type = "triangle";
  engineBassOscillator.frequency.value = 29;
  engineBassGain.gain.value = 0;
  engineBassOscillator.connect(engineBassGain).connect(audioContext.destination);
  engineBassOscillator.start();

  const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let index = 0; index < noiseData.length; index += 1) noiseData[index] = Math.random() * 2 - 1;
  windSource = audioContext.createBufferSource();
  windGain = audioContext.createGain();
  const windFilter = audioContext.createBiquadFilter();
  const tireFilter = audioContext.createBiquadFilter();
  tireGain = audioContext.createGain();
  windSource.buffer = noiseBuffer;
  windSource.loop = true;
  windFilter.type = "bandpass";
  windFilter.frequency.value = 980;
  windFilter.Q.value = 0.55;
  windGain.gain.value = 0;
  tireFilter.type = "bandpass";
  tireFilter.frequency.value = 310;
  tireFilter.Q.value = 0.78;
  tireGain.gain.value = 0;
  windSource.connect(windFilter).connect(windGain).connect(audioContext.destination);
  windSource.connect(tireFilter).connect(tireGain).connect(audioContext.destination);
  windSource.start();
}

function updateAudio(speed, maxSpeed, active, boosting) {
  if (!engineOscillator || !engineGain || !audioContext) return;
  const ratio = THREE.MathUtils.clamp(speed / maxSpeed, 0, 1);
  const now = audioContext.currentTime;
  engineOscillator.frequency.setTargetAtTime(55 + ratio * 138 + (boosting ? 18 : 0), now, 0.05);
  engineGain.gain.setTargetAtTime(state.sound && active ? 0.012 + ratio * 0.027 : 0, now, 0.08);
  if (engineBassOscillator && engineBassGain) {
    engineBassOscillator.frequency.setTargetAtTime(28 + ratio * 48, now, 0.06);
    engineBassGain.gain.setTargetAtTime(state.sound && active ? 0.018 + ratio * 0.018 : 0, now, 0.1);
  }
  if (windGain) windGain.gain.setTargetAtTime(state.sound && active ? Math.max(0, ratio - 0.28) * 0.025 : 0, now, 0.14);
  if (tireGain) {
    const tireActivity = state.race && active
      ? (state.race.offRoad ? 0.026 : 0) + (state.keys.brake && ratio > 0.28 ? 0.018 * ratio : 0)
      : 0;
    tireGain.gain.setTargetAtTime(state.sound ? tireActivity : 0, now, 0.08);
  }
}

function playTone(frequency, duration, type, volume) {
  if (!state.sound || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = type || "sine";
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency * 1.45), now + duration);
  gain.gain.setValueAtTime(volume || 0.035, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
  const whole = Math.floor(safe % 60).toString().padStart(2, "0");
  const tenth = Math.floor((safe % 1) * 10);
  return minutes + ":" + whole + "." + tenth;
}

function getRouteMeta(id) {
  const map = maps[id];
  if (state.mode === "contract") return "ARCHIVE CONTRACT · " + map.timeLimit + " SEC · 4 PAGES";
  if (state.mode === "time_trial") return "TIME TRIAL · " + Math.max(48, map.timeLimit - 8) + " SEC · CLEAN FINISH";
  if (state.mode === "collector") return "COLLECTOR CHALLENGE · " + (map.timeLimit + 18) + " SEC · 3 PHOTOS";
  return "ENDLESS SURVIVAL · " + mapPresentation[id].difficulty + " · LIVING TRAFFIC";
}

function updateBestLabels() {
  document.querySelectorAll("[data-best]").forEach(function (element) {
    if (state.mode === "contract" || state.mode === "time_trial" || state.mode === "collector") {
      const value = Number(localStorage.getItem("tdm-" + state.mode + "-best-" + element.dataset.best));
      element.textContent = value ? "BEST " + formatTime(value) : "BEST —";
    } else {
      const value = Number(localStorage.getItem("tdm-survival-best-" + element.dataset.best));
      element.textContent = value ? "BEST " + (value / 1000).toFixed(1) + " KM" : "BEST — KM";
    }
  });
  archiveTokenCount.textContent = Number(driverProfile.tokens || 0).toString().padStart(2, "0");
}

function selectMode(mode) {
  if (!modeDefinitions[mode]) return;
  state.mode = mode;
  localStorage.setItem("tdm-last-mode", mode);
  modeButtons.forEach(function (button) {
    const selected = button.dataset.mode === mode;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  document.querySelectorAll(".map-mode-label").forEach(function (label) {
    label.textContent = modeDefinitions[mode].label;
  });
  routePreviewMeta.textContent = getRouteMeta(state.map);
  raceButtonLabel.textContent = modeDefinitions[mode].button;
  updateBestLabels();
}

function chooseVehicle(id) {
  const vehicle = vehicles[id];
  if (!vehicle) return;
  state.vehicle = id;
  localStorage.setItem("tdm-last-vehicle", id);
  document.querySelectorAll(".vehicle-select-card").forEach(function (card) {
    const selected = card.dataset.vehicle === id;
    card.classList.toggle("selected", selected);
    card.querySelector(".selected-mark").textContent = selected ? "SELECTED" : "SELECT";
  });
  document.querySelectorAll(".archive-slot[data-vehicle]").forEach(function (slot) {
    slot.classList.toggle("selected", slot.dataset.vehicle === id);
  });
  const catalogEntry = collectionCatalog.find(function (entry) { return entry.vehicleId === id; });
  archivePosition.textContent = String(catalogEntry ? catalogEntry.slot : 1).padStart(2, "0") + " OF 45";
  showroomOwner.textContent = vehicle.ownerInstagram;
  loadShowroomVehicle(id);
}

function chooseMap(id) {
  if (!maps[id]) return;
  state.map = id;
  localStorage.setItem("tdm-last-map", id);
  document.querySelectorAll(".map-card").forEach(function (card) {
    card.classList.toggle("selected", card.dataset.map === id);
  });
  routePreview.dataset.map = id;
  routePreviewKicker.textContent = mapPresentation[id].kicker;
  routePreviewTitle.textContent = maps[id].name;
  routePreviewMeta.textContent = getRouteMeta(id);
}

function buildArchiveRail() {
  const fragment = document.createDocumentFragment();
  collectionCatalog.forEach(function (entry) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "archive-slot";
    button.setAttribute("aria-label", "Archive car " + String(entry.slot).padStart(2, "0"));
    if (entry.status === "active") {
      const vehicle = vehicles[entry.vehicleId];
      button.dataset.vehicle = entry.vehicleId;
      button.innerHTML = '<img src="' + vehicle.image + '" alt="" /><span><small>' + String(entry.slot).padStart(2, "0") + '</small><b>' + vehicle.name + '</b></span>';
      button.classList.toggle("selected", state.vehicle === entry.vehicleId);
      button.addEventListener("click", function () { chooseVehicle(entry.vehicleId); });
    } else {
      button.classList.add("awaiting");
      button.disabled = true;
      button.innerHTML = '<span><small>' + String(entry.slot).padStart(2, "0") + '</small><b>MODEL PENDING</b></span>';
    }
    fragment.appendChild(button);
  });
  archiveRail.appendChild(fragment);
}

function renderLivingArchive() {
  const level = 1 + Math.floor((driverProfile.xp || 0) / 2500);
  document.getElementById("archiveLevel").textContent = String(level).padStart(2, "0");
  document.getElementById("archiveXp").textContent = Math.round(driverProfile.xp || 0).toString().padStart(4, "0");
  document.getElementById("archiveStars").textContent = Math.round(driverProfile.stars || 0).toString().padStart(2, "0");
  document.getElementById("archivePages").textContent = (driverProfile.pages || []).length.toString().padStart(2, "0") + " / 12";
  archiveStoryGrid.innerHTML = Object.values(vehicles).map(function (vehicle) {
    const unlocked = (driverProfile.vehicles || []).includes(vehicle.id);
    return '<article class="story-card' + (unlocked ? "" : " locked") + '"><img src="' + vehicle.resultImage + '" alt="" /><small>'
      + vehicle.archiveLabel + '</small><h3>' + (unlocked ? vehicle.name : "STORY LOCKED") + '</h3><p>'
      + (unlocked ? archiveStories[vehicle.id] + " · OWNER " + vehicle.ownerInstagram : "Recover a lost page while driving this vehicle to unlock its archive story.") + '</p></article>';
  }).join("");
  archivePageGrid.innerHTML = Object.values(maps).flatMap(function (map) {
    return map.pages.map(function (_, index) {
      const key = map.id + "-" + index;
      const unlocked = (driverProfile.pages || []).includes(key);
      return '<article class="archive-page' + (unlocked ? "" : " locked") + '"><b>'
        + (unlocked ? "PAGE " + String(index + 1).padStart(2, "0") : "LOCKED") + '</b><small>' + map.name + '</small></article>';
    });
  }).join("");
}

function setModal(modal, open) {
  modal.classList.toggle("show", open);
  modal.setAttribute("aria-hidden", open ? "false" : "true");
}

function openArchive() {
  renderLivingArchive();
  setModal(archiveModal, true);
}

function closeArchive() {
  setModal(archiveModal, false);
}

function syncSettingsUi() {
  document.querySelectorAll("[data-quality]").forEach(function (button) {
    button.classList.toggle("selected", button.dataset.quality === consoleSettings.quality);
  });
  [
    ["weatherToggle", "weather"],
    ["shakeToggle", "shake"],
    ["hapticsToggle", "haptics"],
  ].forEach(function (entry) {
    const button = document.getElementById(entry[0]);
    const enabled = Boolean(consoleSettings[entry[1]]);
    button.textContent = enabled ? "ON" : "OFF";
    button.classList.toggle("selected", enabled);
  });
}

function applyGraphicsQuality() {
  const qualities = {
    performance: { dpr: 1.2, showroomDpr: 1.2, shadow: 1024 },
    high: { dpr: 1.8, showroomDpr: 1.65, shadow: 2048 },
    ultra: { dpr: 2.5, showroomDpr: 2.25, shadow: 4096 },
  };
  const quality = qualities[consoleSettings.quality] || qualities.ultra;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.dpr));
  showroomRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.showroomDpr));
  sun.shadow.mapSize.set(quality.shadow, quality.shadow);
  showroomKey.shadow.mapSize.set(Math.min(2048, quality.shadow), Math.min(2048, quality.shadow));
  if (sun.shadow.map) {
    sun.shadow.map.dispose();
    sun.shadow.map = null;
  }
  if (showroomKey.shadow.map) {
    showroomKey.shadow.map.dispose();
    showroomKey.shadow.map = null;
  }
  document.body.dataset.quality = consoleSettings.quality;
  resizeRenderer();
  resizeShowroom();
}

function openSettings() {
  syncSettingsUi();
  setModal(settingsModal, true);
}

function closeSettings() {
  setModal(settingsModal, false);
}

function pulseGamepad(duration, strongMagnitude, weakMagnitude) {
  if (!consoleSettings.haptics || !navigator.getGamepads) return;
  const pad = Array.from(navigator.getGamepads()).filter(Boolean)[0];
  const actuator = pad && (pad.vibrationActuator || (pad.hapticActuators && pad.hapticActuators[0]));
  if (!actuator || !actuator.playEffect) return;
  actuator.playEffect("dual-rumble", {
    duration: duration || 90,
    strongMagnitude: strongMagnitude === undefined ? 0.45 : strongMagnitude,
    weakMagnitude: weakMagnitude === undefined ? 0.3 : weakMagnitude,
  }).catch(function () {});
}

let introDismissed = false;
function dismissIntro() {
  if (introDismissed) return;
  introDismissed = true;
  brandIntro.classList.add("hide");
  window.setTimeout(function () { brandIntro.hidden = true; }, 700);
}

introSkip.addEventListener("click", dismissIntro);
window.addEventListener("keydown", function dismissIntroWithKey() { dismissIntro(); }, { once: true });
window.setTimeout(dismissIntro, 2600);

function bindSelectable(selector, callback, dataKey) {
  document.querySelectorAll(selector).forEach(function (item) {
    const select = function () { callback(item.dataset[dataKey]); };
    item.addEventListener("click", select);
    item.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select();
      }
    });
  });
}

bindSelectable(".vehicle-select-card", chooseVehicle, "vehicle");
bindSelectable(".map-card", chooseMap, "map");
modeButtons.forEach(function (button) {
  button.addEventListener("click", function () { selectMode(button.dataset.mode); });
});
buildArchiveRail();
chooseMap(state.map);
selectMode(state.mode);
document.querySelectorAll("[data-screen-target]").forEach(function (button) {
  button.addEventListener("click", function () { showScreen(button.dataset.screenTarget); });
});
document.getElementById("startButton").addEventListener("click", function () { showScreen("vehicle"); });
document.getElementById("vehicleContinue").addEventListener("click", function () {
  updateBestLabels();
  showScreen("map");
});
document.getElementById("raceButton").addEventListener("click", startRace);
document.getElementById("howButton").addEventListener("click", openHow);
document.getElementById("howClose").addEventListener("click", closeHow);
document.getElementById("howStart").addEventListener("click", function () {
  closeHow();
  showScreen("vehicle");
});
howModal.addEventListener("click", function (event) {
  if (event.target === howModal) closeHow();
});
document.getElementById("archiveButton").addEventListener("click", openArchive);
document.getElementById("resultArchiveButton").addEventListener("click", openArchive);
document.getElementById("archiveClose").addEventListener("click", closeArchive);
archiveModal.addEventListener("click", function (event) {
  if (event.target === archiveModal) closeArchive();
});
document.getElementById("settingsButton").addEventListener("click", openSettings);
document.getElementById("pauseSettingsButton").addEventListener("click", openSettings);
document.getElementById("settingsClose").addEventListener("click", closeSettings);
settingsModal.addEventListener("click", function (event) {
  if (event.target === settingsModal) closeSettings();
});
document.querySelectorAll("[data-quality]").forEach(function (button) {
  button.addEventListener("click", function () {
    consoleSettings.quality = button.dataset.quality;
    saveConsoleSettings();
    syncSettingsUi();
    applyGraphicsQuality();
  });
});
[
  ["weatherToggle", "weather"],
  ["shakeToggle", "shake"],
  ["hapticsToggle", "haptics"],
].forEach(function (entry) {
  document.getElementById(entry[0]).addEventListener("click", function () {
    consoleSettings[entry[1]] = !consoleSettings[entry[1]];
    saveConsoleSettings();
    syncSettingsUi();
    if (entry[1] === "weather" && state.race && !consoleSettings.weather) setRaceWeather(state.race, "clear", "CLEAR ROAD");
  });
});
document.getElementById("fullscreenButton").addEventListener("click", function () {
  if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
  else document.documentElement.requestFullscreen().catch(function () {});
});

document.getElementById("soundButton").addEventListener("click", function (event) {
  state.sound = !state.sound;
  event.currentTarget.textContent = state.sound ? "SOUND ON" : "SOUND OFF";
  if (state.sound) initAudio();
  if (!state.sound && engineGain && audioContext) {
    engineGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
    if (engineBassGain) engineBassGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
    if (windGain) windGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
    if (tireGain) tireGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
  }
});

function updateGamepadStatus(connected, name) {
  const label = name || "";
  gamepadStatus.classList.toggle("connected", connected);
  gamepadStatus.innerHTML = "<i></i>" + (connected ? "GAMEPAD READY" + (label ? " · " + label.slice(0, 16) : "") : "GAMEPAD STANDBY");
}

window.addEventListener("gamepadconnected", function (event) {
  updateGamepadStatus(true, event.gamepad.id);
});
window.addEventListener("gamepaddisconnected", function () {
  updateGamepadStatus(false);
});

const keyMap = {
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
  ArrowUp: "gas", w: "gas", W: "gas",
  ArrowDown: "brake", s: "brake", S: "brake",
  Shift: "boost", " ": "boost",
};

window.addEventListener("keydown", function (event) {
  if (keyMap[event.key]) {
    state.keys[keyMap[event.key]] = true;
    if (state.screen === "game") event.preventDefault();
  }
  if (event.key === "Escape") {
    if (settingsModal.classList.contains("show")) closeSettings();
    else if (archiveModal.classList.contains("show")) closeArchive();
    else if (howModal.classList.contains("show")) closeHow();
    else if (state.screen === "game") togglePause();
  }
  if ((event.key === "c" || event.key === "C") && state.screen === "game") {
    event.preventDefault();
    cycleCameraMode();
  }
  if ((event.key === "v" || event.key === "V") && state.screen === "game") {
    event.preventDefault();
    toggleOrbitCamera();
  }
  if ((event.key === "p" || event.key === "P") && state.screen === "game") {
    event.preventDefault();
    takeCollectorPhoto();
  }
});
window.addEventListener("keyup", function (event) {
  if (keyMap[event.key]) state.keys[keyMap[event.key]] = false;
});

document.querySelectorAll("[data-control]").forEach(function (button) {
  const control = button.dataset.control;
  const set = function (value) {
    state.keys[control] = value;
    button.classList.toggle("active", value);
  };
  button.addEventListener("pointerdown", function (event) {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    set(true);
  });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (name) {
    button.addEventListener(name, function () { set(false); });
  });
});
document.querySelectorAll('[data-action="photo"]').forEach(function (button) {
  button.addEventListener("click", takeCollectorPhoto);
});

function readControls() {
  let steer = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
  let gas = state.keys.gas ? 1 : 0;
  let brake = state.keys.brake ? 1 : 0;
  let boost = state.keys.boost ? 1 : 0;
  const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
  const pad = pads[0];
  if (pad) {
    const axis = Math.abs(pad.axes[0] || 0) > 0.12 ? pad.axes[0] : 0;
    steer = Math.abs(axis) > Math.abs(steer) ? axis : steer;
    gas = Math.max(gas, pad.buttons[7] ? pad.buttons[7].value : (pad.buttons[0] && pad.buttons[0].pressed ? 1 : 0));
    brake = Math.max(brake, pad.buttons[6] ? pad.buttons[6].value : (pad.buttons[1] && pad.buttons[1].pressed ? 1 : 0));
    boost = Math.max(boost, pad.buttons[4] && pad.buttons[4].pressed ? 1 : 0, pad.buttons[5] && pad.buttons[5].pressed ? 1 : 0);
    const pausePressed = Boolean(pad.buttons[9] && pad.buttons[9].pressed);
    if (pausePressed && !state.gamepadPauseHeld && state.screen === "game") togglePause();
    state.gamepadPauseHeld = pausePressed;
    const orbitPressed = Boolean(pad.buttons[3] && pad.buttons[3].pressed);
    if (orbitPressed && !state.gamepadOrbitHeld && state.screen === "game") toggleOrbitCamera();
    state.gamepadOrbitHeld = orbitPressed;
    const photoPressed = Boolean(pad.buttons[2] && pad.buttons[2].pressed);
    if (photoPressed && !state.gamepadPhotoHeld && state.screen === "game") takeCollectorPhoto();
    state.gamepadPhotoHeld = photoPressed;
  }
  return { steer, gas, brake, boost };
}

function makeMaterial(color, roughness, metalness) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: roughness === undefined ? 0.6 : roughness,
    metalness: metalness === undefined ? 0.05 : metalness,
  });
}

function createAsphaltTexture(ultra) {
  if (ultra && asphaltUltraTexture) return asphaltUltraTexture;
  if (!ultra && asphaltTexture) return asphaltTexture;
  const texture = textureLoader.load(ultra ? "./maps/asphalt-ultra-v45.jpg" : "./maps/asphalt-ai-v41.jpg");
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.repeat.set(ultra ? 3.05 : 3.4, ultra ? 11.6 : 10.8);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (ultra) asphaltUltraTexture = texture;
  else asphaltTexture = texture;
  return texture;
}

function createAsphaltReliefTexture(ultra) {
  if (ultra && asphaltUltraReliefTexture) return asphaltUltraReliefTexture;
  if (!ultra && asphaltReliefTexture) return asphaltReliefTexture;
  const texture = textureLoader.load(ultra ? "./maps/asphalt-ultra-v45.jpg" : "./maps/asphalt-ai-v41.jpg");
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.repeat.set(ultra ? 3.05 : 3.4, ultra ? 11.6 : 10.8);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (ultra) asphaltUltraReliefTexture = texture;
  else asphaltReliefTexture = texture;
  return texture;
}

function createReflectionEnvironment(map) {
  const cacheKey = "reflection-" + map.id;
  if (environmentTextureCache.has(cacheKey)) return environmentTextureCache.get(cacheKey);
  const envCanvas = document.createElement("canvas");
  envCanvas.width = 2048;
  envCanvas.height = 1024;
  const context = envCanvas.getContext("2d");
  context.scale(2, 2);
  const skyColor = map.scenery === "city" ? "#112a43" : map.scenery === "canyon" ? "#d78955" : "#9fc8c1";
  const horizonColor = map.scenery === "city" ? "#9ddfff" : map.scenery === "canyon" ? "#ffd2a0" : "#e5f2dd";
  const groundColor = map.scenery === "city" ? "#071018" : map.scenery === "canyon" ? "#4b281d" : "#142720";
  const gradient = context.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, skyColor);
  gradient.addColorStop(0.46, horizonColor);
  gradient.addColorStop(0.56, groundColor);
  gradient.addColorStop(1, "#05080b");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1024, 512);
  const sunX = map.scenery === "canyon" ? 760 : map.scenery === "forest" ? 290 : 875;
  const glow = context.createRadialGradient(sunX, 225, 4, sunX, 225, map.scenery === "city" ? 110 : 170);
  glow.addColorStop(0, map.scenery === "city" ? "rgba(170,231,255,.92)" : "rgba(255,238,196,.98)");
  glow.addColorStop(0.16, map.scenery === "city" ? "rgba(82,185,255,.46)" : "rgba(255,180,111,.48)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 1024, 512);
  if (map.scenery === "city") {
    for (let index = 0; index < 96; index += 1) {
      const x = (index * 83) % 1024;
      const width = 4 + index % 7;
      const height = 5 + (index * 11) % 24;
      context.globalAlpha = 0.2 + (index % 5) * 0.08;
      context.fillStyle = index % 4 === 0 ? "#ffd39a" : "#89dfff";
      context.fillRect(x, 252 - height, width, height);
    }
    context.globalAlpha = 1;
  }
  const texture = new THREE.CanvasTexture(envCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  environmentTextureCache.set(cacheKey, texture);
  return texture;
}

showroomScene.environment = createReflectionEnvironment(maps.city);

function getSceneryMaterial(key, factory) {
  if (!sceneryMaterials.has(key)) sceneryMaterials.set(key, factory());
  return sceneryMaterials.get(key);
}

function buildProceduralSky(map) {
  skyWorld.traverse(function (object) {
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
  });
  skyWorld.clear();
  const palette = map.scenery === "city"
    ? { top: 0x020817, horizon: 0x285c83, ground: 0x040911, sun: 0xbfefff, cloud: 0x18324c, cloudAmount: 0.38, night: 1, direction: new THREE.Vector3(0.62, 0.32, -0.72) }
    : map.scenery === "canyon"
      ? { top: 0x234d70, horizon: 0xf3a16b, ground: 0x54281f, sun: 0xffe6b0, cloud: 0xf0b08a, cloudAmount: 0.24, night: 0, direction: new THREE.Vector3(0.56, 0.25, -0.8) }
      : { top: 0x365e78, horizon: 0xd8cda9, ground: 0x172f29, sun: 0xffedbd, cloud: 0xd8e5dd, cloudAmount: 0.46, night: 0, direction: new THREE.Vector3(-0.42, 0.3, -0.86) };
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(palette.top) },
      horizonColor: { value: new THREE.Color(palette.horizon) },
      groundColor: { value: new THREE.Color(palette.ground) },
      sunColor: { value: new THREE.Color(palette.sun) },
      cloudColor: { value: new THREE.Color(palette.cloud) },
      cloudAmount: { value: palette.cloudAmount },
      nightFactor: { value: palette.night },
      sunDirection: { value: palette.direction.normalize() },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 groundColor;
      uniform vec3 sunColor;
      uniform vec3 cloudColor;
      uniform float cloudAmount;
      uniform float nightFactor;
      uniform vec3 sunDirection;
      uniform float time;
      varying vec3 vDirection;

      float hash31(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }

      void main() {
        vec3 direction = normalize(vDirection);
        float heightMix = smoothstep(-0.08, 0.58, direction.y);
        vec3 color = mix(groundColor, horizonColor, smoothstep(-0.18, 0.08, direction.y));
        color = mix(color, topColor, heightMix);
        float sunDot = max(dot(direction, sunDirection), 0.0);
        float sunDisc = pow(sunDot, 880.0);
        float sunGlow = pow(sunDot, 18.0) * 0.24;
        color += sunColor * (sunDisc * 1.55 + sunGlow);
        float horizonGlow = 1.0 - smoothstep(0.0, 0.34, abs(direction.y));
        color += horizonColor * horizonGlow * 0.13;

        float cloudBand = smoothstep(-0.02, 0.09, direction.y) * (1.0 - smoothstep(0.5, 0.82, direction.y));
        float cloudFlow = time * 0.006;
        float cloudNoise = sin(direction.x * 18.0 + cloudFlow)
          + sin(direction.z * 13.0 - cloudFlow * 0.7)
          + sin((direction.x + direction.z) * 29.0 + cloudFlow * 0.42);
        cloudNoise = cloudNoise / 6.0 + 0.5;
        float cloudMask = smoothstep(0.5 + (1.0 - cloudAmount) * 0.18, 0.76, cloudNoise) * cloudBand;
        float cloudLight = 0.42 + pow(max(dot(direction, sunDirection), 0.0), 5.0) * 0.72;
        color = mix(color, cloudColor * cloudLight + horizonColor * 0.12, cloudMask * cloudAmount);

        float starField = step(0.9978, hash31(floor(direction * 780.0)));
        starField *= smoothstep(0.12, 0.5, direction.y) * nightFactor;
        color += vec3(0.68, 0.86, 1.0) * starField * (0.55 + hash31(direction * 331.0));

        float atmosphericDepth = pow(1.0 - max(direction.y, 0.0), 4.0);
        color += horizonColor * atmosphericDepth * 0.045;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(460, 40, 24), material);
  sky.frustumCulled = false;
  sky.renderOrder = -100;
  skyWorld.add(sky);
  activeSkyMaterial = material;
}

function applyMapBackdrop(map) {
  // The drive no longer uses a photographic horizon. Only the procedural sky
  // remains fixed; every structure below it is realtime geometry that passes
  // the camera and produces genuine parallax.
  scene.background = new THREE.Color(map.sky);
  buildProceduralSky(map);
}

function createTerrainTexture(map) {
  if (map.scenery === "forest") return getForestFloorTextures().color;
  const terrainCanvas = document.createElement("canvas");
  terrainCanvas.width = 256;
  terrainCanvas.height = 512;
  const context = terrainCanvas.getContext("2d");
  const palette = map.scenery === "canyon"
    ? ["#79513d", "#9b6d50", "#5d4133", "#b88d69"]
    : map.scenery === "forest"
      ? ["#26372e", "#3c4c3f", "#19261f", "#596452"]
      : ["#202830", "#313a42", "#111820", "#59616a"];
  context.fillStyle = palette[0];
  context.fillRect(0, 0, 256, 512);
  for (let index = 0; index < 3600; index += 1) {
    context.globalAlpha = 0.12 + (index % 7) * 0.035;
    context.fillStyle = palette[(index * 17) % palette.length];
    const size = 1 + index % 4;
    context.fillRect((index * 61) % 256, (index * 113) % 512, size, size * 0.7);
  }
  context.globalAlpha = 0.2;
  context.strokeStyle = palette[2];
  context.lineWidth = 2;
  for (let line = 0; line < 9; line += 1) {
    context.beginPath();
    context.moveTo((line * 47) % 256, 0);
    context.bezierCurveTo(20 + line * 18, 150, 238 - line * 13, 340, (line * 79) % 256, 512);
    context.stroke();
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(terrainCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.2, 7);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function getSoftParticleTexture() {
  if (softParticleTexture) return softParticleTexture;
  const particleCanvas = document.createElement("canvas");
  particleCanvas.width = 64;
  particleCanvas.height = 64;
  const context = particleCanvas.getContext("2d");
  const glow = context.createRadialGradient(32, 32, 1, 32, 32, 30);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.24, "rgba(255,255,255,.72)");
  glow.addColorStop(0.62, "rgba(255,255,255,.18)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 64, 64);
  softParticleTexture = new THREE.CanvasTexture(particleCanvas);
  softParticleTexture.colorSpace = THREE.SRGBColorSpace;
  return softParticleTexture;
}

function getCityFacadeTexture() {
  if (cityFacadeTexture) return cityFacadeTexture;
  const facadeCanvas = document.createElement("canvas");
  facadeCanvas.width = 256;
  facadeCanvas.height = 512;
  const context = facadeCanvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 256, 512);
  gradient.addColorStop(0, "#20344a");
  gradient.addColorStop(0.55, "#101b2a");
  gradient.addColorStop(1, "#07101a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 512);
  for (let floor = 0; floor < 20; floor += 1) {
    for (let column = 0; column < 8; column += 1) {
      const lit = (floor * 11 + column * 7) % 9 < 4;
      context.fillStyle = lit ? ((floor + column) % 3 ? "#b9d7e5" : "#ffd59a") : "#142536";
      context.globalAlpha = lit ? 0.78 : 0.42;
      context.fillRect(12 + column * 30, 12 + floor * 25, 17, 11);
    }
  }
  context.globalAlpha = 1;
  cityFacadeTexture = new THREE.CanvasTexture(facadeCanvas);
  cityFacadeTexture.wrapS = THREE.RepeatWrapping;
  cityFacadeTexture.wrapT = THREE.RepeatWrapping;
  cityFacadeTexture.repeat.set(1.4, 2.4);
  cityFacadeTexture.colorSpace = THREE.SRGBColorSpace;
  cityFacadeTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return cityFacadeTexture;
}

function getPineTexture(species) {
  const isScotsPine = species === 1;
  if (isScotsPine && scotsPineTexture) return scotsPineTexture;
  if (!isScotsPine && pineTexture) return pineTexture;
  const texture = textureLoader.load(isScotsPine ? "./maps/scots-pine-ai-v42.webp" : "./maps/spruce-ai-v41.webp");
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(12, renderer.capabilities.getMaxAnisotropy());
  if (isScotsPine) scotsPineTexture = texture;
  else pineTexture = texture;
  return texture;
}

function getRedRockTexture() {
  if (redRockTexture) return redRockTexture;
  redRockTexture = textureLoader.load("./maps/red-rock-ai-v43.webp");
  redRockTexture.colorSpace = THREE.SRGBColorSpace;
  redRockTexture.minFilter = THREE.LinearMipmapLinearFilter;
  redRockTexture.magFilter = THREE.LinearFilter;
  redRockTexture.anisotropy = Math.min(12, renderer.capabilities.getMaxAnisotropy());
  return redRockTexture;
}

function getCanyonRockTextures() {
  if (canyonRockTexture && canyonRockReliefTexture) return { color: canyonRockTexture, relief: canyonRockReliefTexture };
  canyonRockTexture = textureLoader.load("./maps/canyon-rock-ai-v40.jpg");
  canyonRockTexture.wrapS = THREE.RepeatWrapping;
  canyonRockTexture.wrapT = THREE.RepeatWrapping;
  canyonRockTexture.repeat.set(1.55, 1.55);
  canyonRockTexture.colorSpace = THREE.SRGBColorSpace;
  canyonRockTexture.anisotropy = Math.min(12, renderer.capabilities.getMaxAnisotropy());
  canyonRockReliefTexture = textureLoader.load("./maps/canyon-rock-ai-v40.jpg");
  canyonRockReliefTexture.wrapS = THREE.RepeatWrapping;
  canyonRockReliefTexture.wrapT = THREE.RepeatWrapping;
  canyonRockReliefTexture.repeat.copy(canyonRockTexture.repeat);
  canyonRockReliefTexture.colorSpace = THREE.NoColorSpace;
  canyonRockReliefTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return { color: canyonRockTexture, relief: canyonRockReliefTexture };
}

function getForestFloorTextures() {
  if (forestFloorTexture && forestFloorReliefTexture) return { color: forestFloorTexture, relief: forestFloorReliefTexture };
  forestFloorTexture = textureLoader.load("./maps/forest-floor-ai-v40.jpg");
  forestFloorTexture.wrapS = THREE.RepeatWrapping;
  forestFloorTexture.wrapT = THREE.RepeatWrapping;
  forestFloorTexture.repeat.set(2.4, 7.2);
  forestFloorTexture.colorSpace = THREE.SRGBColorSpace;
  forestFloorTexture.anisotropy = Math.min(12, renderer.capabilities.getMaxAnisotropy());
  forestFloorReliefTexture = textureLoader.load("./maps/forest-floor-ai-v40.jpg");
  forestFloorReliefTexture.wrapS = THREE.RepeatWrapping;
  forestFloorReliefTexture.wrapT = THREE.RepeatWrapping;
  forestFloorReliefTexture.repeat.copy(forestFloorTexture.repeat);
  forestFloorReliefTexture.colorSpace = THREE.NoColorSpace;
  forestFloorReliefTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return { color: forestFloorTexture, relief: forestFloorReliefTexture };
}

function getAlpineGraniteTextures() {
  if (alpineGraniteTexture && alpineGraniteReliefTexture) {
    return { color: alpineGraniteTexture, relief: alpineGraniteReliefTexture };
  }
  alpineGraniteTexture = textureLoader.load("./maps/alpine-granite-ai-v41.jpg");
  alpineGraniteTexture.wrapS = THREE.MirroredRepeatWrapping;
  alpineGraniteTexture.wrapT = THREE.MirroredRepeatWrapping;
  alpineGraniteTexture.repeat.set(1.45, 1.45);
  alpineGraniteTexture.colorSpace = THREE.SRGBColorSpace;
  alpineGraniteTexture.anisotropy = Math.min(12, renderer.capabilities.getMaxAnisotropy());
  alpineGraniteReliefTexture = textureLoader.load("./maps/alpine-granite-ai-v41.jpg");
  alpineGraniteReliefTexture.wrapS = THREE.MirroredRepeatWrapping;
  alpineGraniteReliefTexture.wrapT = THREE.MirroredRepeatWrapping;
  alpineGraniteReliefTexture.repeat.copy(alpineGraniteTexture.repeat);
  alpineGraniteReliefTexture.colorSpace = THREE.NoColorSpace;
  alpineGraniteReliefTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return { color: alpineGraniteTexture, relief: alpineGraniteReliefTexture };
}

function createContactShadow(vehicle) {
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 256;
  shadowCanvas.height = 512;
  const context = shadowCanvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 256, 15, 128, 256, 122);
  gradient.addColorStop(0, "rgba(0,0,0,.8)");
  gradient.addColorStop(0.48, "rgba(0,0,0,.46)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 512);
  const texture = new THREE.CanvasTexture(shadowCanvas);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(vehicle.targetWidth * 1.38, vehicle.targetLength * 1.08),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.78, depthWrite: false, toneMapped: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.014;
  shadow.renderOrder = 1;
  return shadow;
}

function createWheel(radius, width) {
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 20),
    makeMaterial(0x111216, 0.82, 0.12),
  );
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.57, radius * 0.57, width * 1.04, 18),
    makeMaterial(0xa9b0b6, 0.2, 0.88),
  );
  wheel.add(rim);
  wheel.rotation.z = Math.PI / 2;
  wheel.userData.isWheelSpin = true;
  wheel.castShadow = true;
  return wheel;
}

function createFallbackVehicle(vehicle, trafficColor) {
  const group = new THREE.Group();
  const color = trafficColor === undefined ? vehicle.color : trafficColor;
  const bodyMaterial = makeMaterial(color, 0.28, 0.54);
  const darkMaterial = makeMaterial(0x111820, 0.2, 0.34);
  const chromeMaterial = makeMaterial(0xd9dde2, 0.18, 0.9);
  const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x8d1010, emissive: 0x500000, emissiveIntensity: 1.8 });
  const length = vehicle.truck ? 5.45 : 4.65;
  const width = vehicle.truck ? 2.18 : 1.92;
  const bodyHeight = vehicle.truck ? 0.76 : 0.58;
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, bodyHeight, length), bodyMaterial);
  body.position.y = vehicle.truck ? 0.92 : 0.68;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(width * 0.93, bodyHeight * 0.55, length * 0.3), bodyMaterial);
  hood.position.set(0, body.position.y + bodyHeight * 0.43, -length * 0.31);
  hood.castShadow = true;
  group.add(hood);

  const cabinLength = vehicle.truck ? length * 0.36 : length * 0.48;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.84, vehicle.truck ? 1.0 : 0.83, cabinLength), darkMaterial);
  cabin.position.set(0, vehicle.truck ? 1.58 : 1.25, vehicle.truck ? -0.28 : 0.02);
  cabin.castShadow = true;
  group.add(cabin);

  if (vehicle.truck) {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.5, length * 0.35), bodyMaterial);
    bed.position.set(0, 1.08, length * 0.3);
    bed.castShadow = true;
    group.add(bed);
    const rack = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.13, length * 0.42), darkMaterial);
    rack.position.set(0, 2.22, 0.2);
    rack.castShadow = true;
    group.add(rack);
  }

  const wheelZ = length * 0.31;
  const wheelRadius = vehicle.truck ? 0.57 : 0.44;
  [-1, 1].forEach(function (side) {
    [-wheelZ, wheelZ].forEach(function (z) {
      const wheel = createWheel(wheelRadius, 0.34);
      wheel.position.set(side * width * 0.54, wheelRadius, z);
      group.add(wheel);
    });
  });

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(width * 0.94, 0.18, 0.15), chromeMaterial);
  bumper.position.set(0, 0.62, length * 0.51);
  group.add(bumper);
  [-0.6, 0.6].forEach(function (xFactor) {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(width * 0.18, 0.24, 0.08), tailMaterial);
    tail.position.set(xFactor * width * 0.58, 0.98, length * 0.515);
    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.2, 0.2, 0.065),
      new THREE.MeshStandardMaterial({ color: 0xeaf6ff, emissive: 0xaedfff, emissiveIntensity: 2.4, roughness: 0.2 }),
    );
    headlight.position.set(xFactor * width * 0.58, vehicle.truck ? 1.0 : 0.88, -length * 0.515);
    group.add(tail, headlight);
  });
  const rearGlass = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.68, vehicle.truck ? 0.44 : 0.36, 0.035),
    new THREE.MeshStandardMaterial({ color: 0x172632, roughness: 0.12, metalness: 0.38, transparent: true, opacity: 0.82 }),
  );
  rearGlass.position.set(0, vehicle.truck ? 1.58 : 1.28, vehicle.truck ? 0.38 : cabinLength * 0.51);
  group.add(rearGlass);
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.32, 0.18, 0.035),
    new THREE.MeshStandardMaterial({ color: 0xe8e3d2, roughness: 0.42, metalness: 0.08 }),
  );
  plate.position.set(0, 0.72, length * 0.535);
  group.add(plate);
  group.userData.isFallback = true;
  group.userData.tailMaterial = tailMaterial;
  return group;
}

function getVehicleAxisCorrection(root) {
  root.updateMatrixWorld(true);
  const rootInverse = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const localMatrix = new THREE.Matrix4();
  const point = new THREE.Vector3();
  let sumX = 0;
  let sumZ = 0;
  let count = 0;

  root.traverse(function (child) {
    if (!child.isMesh || !child.geometry || !child.geometry.getAttribute("position")) return;
    const position = child.geometry.getAttribute("position");
    const step = Math.max(1, Math.ceil(position.count / 6000));
    localMatrix.multiplyMatrices(rootInverse, child.matrixWorld);
    for (let index = 0; index < position.count; index += step) {
      point.fromBufferAttribute(position, index).applyMatrix4(localMatrix);
      sumX += point.x;
      sumZ += point.z;
      count += 1;
    }
  });
  if (count < 3) return 0;

  const meanX = sumX / count;
  const meanZ = sumZ / count;
  let covarianceXX = 0;
  let covarianceXZ = 0;
  let covarianceZZ = 0;
  root.traverse(function (child) {
    if (!child.isMesh || !child.geometry || !child.geometry.getAttribute("position")) return;
    const position = child.geometry.getAttribute("position");
    const step = Math.max(1, Math.ceil(position.count / 6000));
    localMatrix.multiplyMatrices(rootInverse, child.matrixWorld);
    for (let index = 0; index < position.count; index += step) {
      point.fromBufferAttribute(position, index).applyMatrix4(localMatrix);
      const x = point.x - meanX;
      const z = point.z - meanZ;
      covarianceXX += x * x;
      covarianceXZ += x * z;
      covarianceZZ += z * z;
    }
  });

  const principalAngleFromX = 0.5 * Math.atan2(2 * covarianceXZ, covarianceXX - covarianceZZ);
  let correction = principalAngleFromX - Math.PI / 2;
  while (correction > Math.PI / 2) correction -= Math.PI;
  while (correction < -Math.PI / 2) correction += Math.PI;
  return Number.isFinite(correction) ? correction : 0;
}

function normalizeImportedCar(source, vehicle) {
  const root = source.clone(true);
  root.traverse(function (child) {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (vehicle.tripoModel) {
        const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
        const preparedMaterials = sourceMaterials.map(function (sourceMaterial) {
          const material = sourceMaterial.clone();
          material.envMapIntensity = (vehicle.materialBoost || 1.25) * 1.28;
          material.roughness = THREE.MathUtils.clamp((material.roughness === undefined ? 0.5 : material.roughness) * (vehicle.truck ? 0.86 : 0.7), 0.13, 0.72);
          material.metalness = THREE.MathUtils.clamp(material.metalness === undefined ? 0.18 : material.metalness, 0.04, 0.88);
          if (material.isMeshPhysicalMaterial) {
            material.clearcoat = Math.max(material.clearcoat || 0, vehicle.truck ? 0.34 : 0.58);
            material.clearcoatRoughness = vehicle.truck ? 0.3 : 0.2;
          }
          if (material.normalScale) material.normalScale.multiplyScalar(vehicle.truck ? 0.9 : 0.72);
          if (material.map) material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
          if (material.normalMap) material.normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
          if (material.roughnessMap) material.roughnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
          if (material.metalnessMap) material.metalnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
          material.needsUpdate = true;
          return material;
        });
        child.material = Array.isArray(child.material) ? preparedMaterials : preparedMaterials[0];
        return;
      }
      const geometry = child.geometry.clone();
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      const localBox = geometry.boundingBox;
      const position = geometry.getAttribute("position");
      const colors = new Float32Array(position.count * 3);
      const body = new THREE.Color(vehicle.color);
      const glass = new THREE.Color(vehicle.truck ? 0x17222a : 0x191b22);
      const rubber = new THREE.Color(0x090b0e);
      const metal = new THREE.Color(0x737b82);
      const centerX = (localBox.min.x + localBox.max.x) / 2;
      const centerZ = (localBox.min.z + localBox.max.z) / 2;
      const halfWidth = Math.max((localBox.max.x - localBox.min.x) / 2, 0.001);
      const halfLength = Math.max((localBox.max.z - localBox.min.z) / 2, 0.001);
      const height = Math.max(localBox.max.y - localBox.min.y, 0.001);
      const vertexColor = new THREE.Color();

      for (let index = 0; index < position.count; index += 1) {
        const x = Math.abs((position.getX(index) - centerX) / halfWidth);
        const y = (position.getY(index) - localBox.min.y) / height;
        const z = Math.abs((position.getZ(index) - centerZ) / halfLength);
        const wheelZone = y < 0.34 && x > 0.62 && z > 0.24;
        const glassZone = y > (vehicle.truck ? 0.5 : 0.46) && y < 0.84 && z < 0.58;
        const underbody = y < 0.1;
        const bumper = y < 0.42 && z > 0.86;

        vertexColor.copy(body);
        if (bumper) vertexColor.copy(metal);
        if (glassZone) vertexColor.copy(glass);
        if (wheelZone || underbody) vertexColor.copy(rubber);
        colors[index * 3] = vertexColor.r;
        colors[index * 3 + 1] = vertexColor.g;
        colors[index * 3 + 2] = vertexColor.b;
      }

      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      child.geometry = geometry;
      child.material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        vertexColors: true,
        roughness: 0.3,
        metalness: 0.52,
        envMapIntensity: 1.15,
      });
    }
  });

  root.updateMatrixWorld(true);
  const axisCorrection = getVehicleAxisCorrection(root);
  root.rotation.y += axisCorrection + (vehicle.modelRotation || 0);
  root.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(root);
  let size = box.getSize(new THREE.Vector3());
  const horizontalLength = Math.max(size.x, size.z);
  const scale = horizontalLength > 0 ? vehicle.targetLength / horizontalLength : 1;
  root.scale.multiplyScalar(scale);
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  size = box.getSize(new THREE.Vector3());
  if (vehicle.targetWidth && size.x > 0) root.scale.x *= vehicle.targetWidth / size.x;
  if (vehicle.targetHeight && size.y > 0) root.scale.y *= vehicle.targetHeight / size.y;
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box.min.y;
  root.position.y += vehicle.rideHeight || 0;

  const wrapper = new THREE.Group();
  wrapper.add(root);
  if (!vehicle.tripoModel) {
    const wheelWidth = vehicle.truck ? 0.38 : 0.3;
    [-1, 1].forEach(function (side) {
      [-vehicle.wheelBase, vehicle.wheelBase].forEach(function (z) {
        const wheel = createWheel(vehicle.wheelRadius, wheelWidth);
        wheel.position.set(side * vehicle.targetWidth * 0.5, vehicle.wheelRadius, z);
        wrapper.add(wheel);
      });
    });

    const lampHeight = vehicle.truck ? 0.92 : 0.62;
    const lampWidth = vehicle.truck ? 0.34 : 0.28;
    [-1, 1].forEach(function (side) {
      const headlight = new THREE.Mesh(
        new THREE.BoxGeometry(lampWidth, lampWidth * 0.46, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xeaf6ff, emissive: 0xb8ddff, emissiveIntensity: 2.2 }),
      );
      headlight.position.set(side * vehicle.targetWidth * 0.32, lampHeight, -vehicle.targetLength * 0.495);
      const taillight = new THREE.Mesh(
        new THREE.BoxGeometry(lampWidth, lampWidth * 0.52, 0.06),
        new THREE.MeshStandardMaterial({ color: 0xa80f18, emissive: 0x690006, emissiveIntensity: 1.8 }),
      );
      taillight.position.set(side * vehicle.targetWidth * 0.34, lampHeight, vehicle.targetLength * 0.495);
      wrapper.add(headlight, taillight);
    });
  }
  wrapper.userData.isFallback = false;
  return wrapper;
}

function warmVehicleModel(vehicle) {
  if (!modelCache.has(vehicle.id)) {
    modelCache.set(vehicle.id, gltfLoader.loadAsync(vehicle.model));
  }
  return modelCache.get(vehicle.id);
}

function resizeShowroom() {
  const rect = showroomCanvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const dprCap = consoleSettings.quality === "performance" ? 1.2 : consoleSettings.quality === "high" ? 1.65 : 2.25;
  showroomRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  showroomRenderer.setSize(width, height, false);
  showroomCamera.aspect = width / height;
  showroomCamera.updateProjectionMatrix();
}

async function loadShowroomVehicle(id) {
  const vehicle = vehicles[id];
  if (!vehicle || showroom.vehicleId === id && showroom.model) return;
  const token = showroom.loadToken + 1;
  showroom.loadToken = token;
  showroom.vehicleId = id;
  showroomLoading.classList.remove("ready");
  showroomLoading.textContent = "LOADING PBR MODEL";
  showroomName.textContent = vehicle.name;
  showroomArchive.textContent = vehicle.archiveLabel;
  showroomOwner.textContent = vehicle.ownerInstagram;
  try {
    const gltf = await warmVehicleModel(vehicle);
    if (token !== showroom.loadToken) return;
    const model = addVehicleAccessories(normalizeImportedCar(gltf.scene, vehicle), vehicle);
    model.traverse(function (child) { if (child.userData.isWheelRig) child.visible = false; });
    model.add(createContactShadow(vehicle));
    if (showroom.model) showroomScene.remove(showroom.model);
    showroom.model = model;
    showroom.model.rotation.y = showroom.yaw;
    showroomScene.add(model);
    showroomCamera.position.set(0, Math.max(2.1, vehicle.targetHeight * 1.55), vehicle.showroomDistance || 8.4);
    showroomCamera.lookAt(0, vehicle.targetHeight * 0.58, 0);
    showroomLoading.textContent = "REAL-TIME PBR MODEL READY";
    window.setTimeout(function () {
      if (token === showroom.loadToken) showroomLoading.classList.add("ready");
    }, 450);
    resizeShowroom();
  } catch (error) {
    if (token !== showroom.loadToken) return;
    if (showroom.model) showroomScene.remove(showroom.model);
    showroom.model = createFallbackVehicle(vehicle);
    showroomScene.add(showroom.model);
    showroomLoading.textContent = "LOCAL 3D PREVIEW ACTIVE";
  }
}

function setShowroomAuto(enabled) {
  showroom.autoRotate = enabled;
  showroomAutoButton.classList.toggle("active", enabled);
  showroomAutoButton.setAttribute("aria-pressed", enabled ? "true" : "false");
}

function renderShowroom(timeMs) {
  const dt = Math.min(0.05, Math.max(0, (timeMs - showroom.lastTime) / 1000));
  showroom.lastTime = timeMs;
  if (state.screen === "vehicle") {
    if (showroom.autoRotate && !showroom.dragging) showroom.targetYaw += dt * 0.36;
    showroom.yaw = THREE.MathUtils.lerp(showroom.yaw, showroom.targetYaw, 1 - Math.pow(0.0008, dt));
    if (showroom.model) {
      showroom.model.rotation.y = showroom.yaw;
      animateVehicleWheels(showroom.model, dt * 0.72, 0.05);
    }
    showroomRenderer.render(showroomScene, showroomCamera);
  }
  showroom.raf = requestAnimationFrame(renderShowroom);
}

showroomCanvas.addEventListener("pointerdown", function (event) {
  showroom.dragging = true;
  showroom.pointerX = event.clientX;
  setShowroomAuto(false);
  showroomCanvas.setPointerCapture(event.pointerId);
});
showroomCanvas.addEventListener("pointermove", function (event) {
  if (!showroom.dragging) return;
  showroom.targetYaw += (event.clientX - showroom.pointerX) * 0.012;
  showroom.pointerX = event.clientX;
});
["pointerup", "pointercancel", "lostpointercapture"].forEach(function (name) {
  showroomCanvas.addEventListener(name, function () { showroom.dragging = false; });
});
showroomCanvas.addEventListener("wheel", function (event) {
  event.preventDefault();
  setShowroomAuto(false);
  showroom.targetYaw += Math.sign(event.deltaY) * 0.24;
}, { passive: false });
document.getElementById("showroomLeft").addEventListener("click", function () {
  setShowroomAuto(false);
  showroom.targetYaw -= Math.PI / 4;
});
document.getElementById("showroomRight").addEventListener("click", function () {
  setShowroomAuto(false);
  showroom.targetYaw += Math.PI / 4;
});
showroomAutoButton.addEventListener("click", function () { setShowroomAuto(!showroom.autoRotate); });
showroomStage.addEventListener("dblclick", function () {
  showroom.targetYaw = -0.42;
  setShowroomAuto(true);
});
showroom.raf = requestAnimationFrame(renderShowroom);

async function prepareTrafficModelPrototypes() {
  const activeVehicleIds = collectionCatalog
    .filter(function (entry) { return entry.status === "active" && entry.vehicleId && vehicles[entry.vehicleId]; })
    .map(function (entry) { return entry.vehicleId; });
  await Promise.all(activeVehicleIds.map(async function (vehicleId) {
    if (trafficModelPrototypes.has(vehicleId)) return;
    const vehicle = vehicles[vehicleId];
    try {
      const gltf = await warmVehicleModel(vehicle);
      const prototype = addVehicleAccessories(normalizeImportedCar(gltf.scene, vehicle), vehicle);
      prototype.add(createContactShadow(vehicle));
      trafficModelPrototypes.set(vehicleId, prototype);
    } catch (error) {
      console.warn("Collection traffic model unavailable:", vehicleId, error);
    }
  }));
}

function getTrafficCollectionVehicle(index, playerVehicleId) {
  const eligible = collectionCatalog.filter(function (entry) {
    return entry.status === "active" && entry.vehicleId && entry.vehicleId !== playerVehicleId && trafficModelPrototypes.has(entry.vehicleId);
  });
  const pool = eligible.length ? eligible : collectionCatalog.filter(function (entry) {
    return entry.status === "active" && entry.vehicleId && trafficModelPrototypes.has(entry.vehicleId);
  });
  return pool.length ? pool[index % pool.length] : null;
}

function addAccessoryMesh(group, geometry, material, position, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function createRoundedPanelGeometry(width, height, depth, radius) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corner = Math.min(radius, halfWidth, halfHeight);
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + corner, -halfHeight);
  shape.lineTo(halfWidth - corner, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
  shape.lineTo(halfWidth, halfHeight - corner);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
  shape.lineTo(-halfWidth + corner, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
  shape.lineTo(-halfWidth, -halfHeight + corner);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: Math.min(0.035, depth * 0.28),
    bevelThickness: Math.min(0.035, depth * 0.28),
    curveSegments: 8,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createProfileBodyGeometry(points, width) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(function (point) {
    shape.lineTo(point[0], point[1]);
  });
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.055,
    bevelThickness: 0.055,
    curveSegments: 6,
  });
  geometry.translate(0, 0, -width / 2);
  geometry.rotateY(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function addSilveradoAccessories(group, vehicle) {
  const body = makeMaterial(vehicle.color, 0.24, 0.58);
  const black = makeMaterial(0x090c10, 0.4, 0.48);
  const graphite = makeMaterial(0x252b31, 0.34, 0.66);
  const silver = makeMaterial(0xb5bcc2, 0.18, 0.86);
  const red = makeMaterial(0xb51220, 0.38, 0.34);
  const rearZ = vehicle.targetLength * 0.51;

  addAccessoryMesh(
    group,
    createProfileBodyGeometry([
      [-2.72, 0.42], [-2.7, 1.28], [-0.78, 1.3], [-0.6, 1.96],
      [1.23, 2.02], [1.55, 1.45], [2.53, 1.24], [2.72, 0.65], [2.64, 0.42],
    ], 2.02),
    body,
    [0, 0, 0],
  );

  addAccessoryMesh(group, createRoundedPanelGeometry(1.98, 0.78, 0.14, 0.1), body, [0, 1.01, rearZ + 0.07]);
  addAccessoryMesh(group, new THREE.BoxGeometry(1.68, 0.035, 0.04), graphite, [0, 1.35, rearZ + 0.16]);
  addAccessoryMesh(group, createRoundedPanelGeometry(0.35, 0.07, 0.055, 0.025), black, [0, 1.18, rearZ + 0.18]);
  addAccessoryMesh(group, createRoundedPanelGeometry(1.7, 0.63, 0.08, 0.08), black, [0, 1.68, 0.54]);
  addAccessoryMesh(group, new THREE.BoxGeometry(1.88, 0.08, 2.3), body, [0, 1.29, 1.52]);
  [-0.88, 0.88].forEach(function (x) {
    addAccessoryMesh(group, createRoundedPanelGeometry(0.18, 0.56, 0.08, 0.035), red, [x, 1.03, rearZ + 0.18]);
  });

  [-0.91, 0.91].forEach(function (x) {
    [-0.82, 1.43].forEach(function (z) {
      addAccessoryMesh(group, new THREE.BoxGeometry(0.075, 1.18, 0.075), graphite, [x, 1.52, z]);
    });
    addAccessoryMesh(group, new THREE.BoxGeometry(0.085, 0.085, 2.72), graphite, [x, 2.08, 0.32]);
  });
  [-0.87, 0.18, 1.22].forEach(function (z) {
    addAccessoryMesh(group, new THREE.BoxGeometry(1.92, 0.08, 0.09), graphite, [0, 2.08, z]);
  });

  addAccessoryMesh(group, new THREE.BoxGeometry(1.78, 0.32, 2.22), black, [0, 2.27, 0.33]);
  addAccessoryMesh(group, new THREE.BoxGeometry(1.86, 0.08, 2.3), silver, [0, 2.47, 0.33]);
  addAccessoryMesh(group, new THREE.BoxGeometry(2.05, 0.18, 0.2), graphite, [0, 0.55, rearZ + 0.11]);
  [-0.82, 0.82].forEach(function (x) {
    addAccessoryMesh(group, new THREE.BoxGeometry(0.075, 1.28, 0.075), graphite, [x, 1.12, rearZ + 0.2]);
  });
  addAccessoryMesh(group, new THREE.BoxGeometry(1.72, 0.075, 0.075), graphite, [0, 1.61, rearZ + 0.2]);

  const spare = addAccessoryMesh(
    group,
    new THREE.CylinderGeometry(0.52, 0.52, 0.3, 24),
    makeMaterial(0x0c0e11, 0.88, 0.08),
    [0.26, 1.08, rearZ + 0.28],
    [Math.PI / 2, 0, 0],
  );
  addAccessoryMesh(
    spare,
    new THREE.CylinderGeometry(0.27, 0.27, 0.31, 16),
    silver,
    [0, 0, 0],
  );
  addAccessoryMesh(group, new THREE.BoxGeometry(0.42, 0.7, 0.16), red, [-0.6, 0.98, rearZ + 0.31]);
  addAccessoryMesh(group, new THREE.BoxGeometry(0.2, 0.96, 0.12), red, [0.78, 1.2, rearZ + 0.31], [0, 0, -0.12]);
}

function addClkAccessories(group, vehicle) {
  const body = makeMaterial(vehicle.color, 0.22, 0.62);
  const tan = makeMaterial(0xb78a68, 0.78, 0.05);
  const dark = makeMaterial(0x101319, 0.3, 0.55);
  const chrome = makeMaterial(0xc7ccd1, 0.16, 0.92);
  const red = new THREE.MeshStandardMaterial({ color: 0xb40c18, emissive: 0x4d0006, emissiveIntensity: 1.1, roughness: 0.3 });
  const rearZ = vehicle.targetLength * 0.5;

  addAccessoryMesh(
    group,
    createProfileBodyGeometry([
      [-2.33, 0.34], [-2.3, 0.78], [-1.45, 0.96], [-0.72, 1.06],
      [0.66, 1.04], [1.35, 0.9], [2.2, 0.67], [2.33, 0.38],
    ], 1.74),
    body,
    [0, 0, 0],
  );

  addAccessoryMesh(group, createRoundedPanelGeometry(1.78, 0.52, 0.16, 0.15), body, [0, 0.69, rearZ + 0.03]);
  addAccessoryMesh(group, new THREE.BoxGeometry(1.7, 0.16, 1.14), body, [0, 0.92, 1.73]);
  addAccessoryMesh(group, createRoundedPanelGeometry(0.34, 0.1, 0.04, 0.03), chrome, [0, 0.78, rearZ + 0.14]);
  addAccessoryMesh(group, new THREE.BoxGeometry(1.62, 0.14, 0.12), dark, [0, 0.38, rearZ + 0.13]);
  [-0.62, 0.62].forEach(function (x) {
    addAccessoryMesh(group, createRoundedPanelGeometry(0.48, 0.18, 0.07, 0.07), red, [x, 0.78, rearZ + 0.14]);
  });

  [-0.46, 0.46].forEach(function (x) {
    addAccessoryMesh(group, new THREE.BoxGeometry(0.52, 0.7, 0.24), tan, [x, 1.03, -0.2], [-0.08, 0, 0]);
    addAccessoryMesh(group, new THREE.SphereGeometry(0.19, 18, 12), tan, [x, 1.46, -0.24]);
    addAccessoryMesh(group, new THREE.TorusGeometry(0.2, 0.038, 8, 20, Math.PI), chrome, [x, 1.17, 0.42]);
  });
  addAccessoryMesh(group, new THREE.BoxGeometry(1.55, 0.11, 0.09), dark, [0, 1.28, -0.82]);
  [-0.76, 0.76].forEach(function (x) {
    addAccessoryMesh(group, new THREE.BoxGeometry(0.07, 0.76, 0.08), dark, [x, 0.96, -0.82], [0, 0, x * -0.2]);
  });
  addAccessoryMesh(group, new THREE.BoxGeometry(1.36, 0.1, 0.18), chrome, [0, 0.79, rearZ + 0.02]);
  [-0.66, -0.36].forEach(function (x) {
    addAccessoryMesh(
      group,
      new THREE.CylinderGeometry(0.095, 0.095, 0.24, 18),
      chrome,
      [x, 0.36, rearZ + 0.11],
      [Math.PI / 2, 0, 0],
    );
  });
}

function installAnimatedWheelRig(group, vehicle) {
  if (group.userData.hasAnimatedWheelRig) return group;
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x080a0c, roughness: 0.86, metalness: 0.06 });
  const rimMaterial = new THREE.MeshPhysicalMaterial({ color: vehicle.truck ? 0x343b42 : 0xb8b9b5, roughness: 0.2, metalness: 0.88, clearcoat: 0.42 });
  [-1, 1].forEach(function (side) {
    [-vehicle.wheelBase, vehicle.wheelBase].forEach(function (z) {
      const steeringPivot = new THREE.Group();
      steeringPivot.position.set(side * vehicle.targetWidth * (vehicle.truck ? 0.405 : 0.425), vehicle.wheelRadius * 0.92, z);
      steeringPivot.userData.isWheelRig = true;
      steeringPivot.userData.isSteeringWheel = z < 0;
      const spin = new THREE.Group();
      spin.userData.isWheelSpin = true;
      const radius = vehicle.wheelRadius * 0.84;
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.22, 28), tireMaterial);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, 0.235, 14), rimMaterial);
      tire.rotation.z = Math.PI / 2;
      rim.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      rim.castShadow = true;
      spin.add(tire, rim);
      steeringPivot.add(spin);
      group.add(steeringPivot);
    });
  });
  group.userData.hasAnimatedWheelRig = true;
  return group;
}

function animateVehicleWheels(root, rotationStep, steer) {
  if (!root) return;
  const motionOpacity = THREE.MathUtils.clamp(Math.abs(rotationStep) * 7.5, 0, 0.78);
  root.traverse(function (child) {
    if (child.userData.isWheelSpin) child.rotation.x -= rotationStep;
    if (child.userData.isSteeringWheel) child.rotation.y = THREE.MathUtils.lerp(child.rotation.y, (steer || 0) * 0.28, 0.18);
    if (child.userData.isWheelMotionLayer && child.material) {
      child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, motionOpacity, 0.22);
    }
  });
}

function createWheelMotionTexture(vehicle) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const center = 128;
  const radius = 113;

  const tireShade = context.createRadialGradient(center, center, 24, center, center, radius);
  tireShade.addColorStop(0, "rgba(10,13,16,.12)");
  tireShade.addColorStop(0.48, vehicle.truck ? "rgba(38,44,49,.62)" : "rgba(168,171,169,.55)");
  tireShade.addColorStop(0.73, "rgba(13,16,19,.56)");
  tireShade.addColorStop(0.95, "rgba(3,5,7,.18)");
  tireShade.addColorStop(1, "rgba(3,5,7,0)");
  context.fillStyle = tireShade;
  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(center, center);
  context.strokeStyle = vehicle.truck ? "rgba(183,193,201,.86)" : "rgba(229,224,213,.9)";
  context.lineWidth = vehicle.truck ? 10 : 8;
  context.lineCap = "round";
  for (let index = 0; index < (vehicle.truck ? 8 : 10); index += 1) {
    context.rotate((Math.PI * 2) / (vehicle.truck ? 8 : 10));
    context.beginPath();
    context.moveTo(18, 0);
    context.quadraticCurveTo(49, -8, 82, 2);
    context.stroke();
  }
  context.fillStyle = vehicle.truck ? "rgba(42,48,54,.96)" : "rgba(190,187,179,.96)";
  context.beginPath();
  context.arc(0, 0, vehicle.truck ? 24 : 21, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "rgba(242,246,247,.78)";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(0, 0, vehicle.truck ? 12 : 10, 0, Math.PI * 2);
  context.stroke();
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function installWheelMotionLayers(group, vehicle) {
  if (group.userData.hasWheelMotionLayers) return group;
  const texture = createWheelMotionTexture(vehicle);
  const wheelZ = vehicle.wheelVisualZ || [-vehicle.wheelBase, vehicle.wheelBase];
  const faceX = vehicle.wheelFaceX || vehicle.targetWidth * 0.5;
  const radius = vehicle.wheelVisualRadius || vehicle.wheelRadius * 0.84;
  const centerY = vehicle.wheelVisualY || vehicle.wheelRadius;

  [-1, 1].forEach(function (side) {
    wheelZ.forEach(function (z, axleIndex) {
      const steeringPivot = new THREE.Group();
      steeringPivot.position.set(side * (faceX + 0.012), centerY, z);
      steeringPivot.userData.isSteeringWheel = axleIndex === 0;

      const spin = new THREE.Group();
      spin.userData.isWheelSpin = true;
      const face = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 48),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          depthTest: true,
          toneMapped: false,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
      );
      face.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      face.userData.isWheelMotionLayer = true;
      face.renderOrder = 8;
      spin.add(face);
      steeringPivot.add(spin);
      group.add(steeringPivot);
    });
  });
  group.userData.hasWheelMotionLayers = true;
  return group;
}

function tagSeparatedWheelMeshes(group) {
  let count = 0;
  group.traverse(function (child) {
    if (!child.isMesh || !/(wheel|tire|tyre|rim)/i.test(child.name || "")) return;
    child.userData.isWheelSpin = true;
    count += 1;
  });
  group.userData.animatedWheelMeshCount = count;
  return group;
}

function addVehicleAccessories(group, vehicle) {
  if (vehicle.tripoModel) {
    group.userData.isPhotoBased = false;
    group.userData.isGeneratedPbrModel = true;
    // Tripo exports these two reference cars as one continuous mesh, so their
    // baked wheels cannot be rotated independently. Named wheel meshes remain
    // supported for future GLBs; current cars get aligned, speed-controlled
    // rim motion layers without replacing or distorting the original body.
    tagSeparatedWheelMeshes(group);
    return installWheelMotionLayers(group, vehicle);
  }
  // The single-view AI mesh is kept only as an internal scale reference. It is
  // intentionally not rendered: every visible pixel of the player car comes
  // from real-time 3D geometry, materials, lighting and shadows.
  if (group.children[0]) group.children[0].visible = false;
  if (vehicle.truck) addSilveradoAccessories(group, vehicle);
  else addClkAccessories(group, vehicle);
  group.userData.isPhotoBased = false;
  return installAnimatedWheelRig(group, vehicle);
}

function addPlayerLights(group, vehicle) {
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group);
  const size = bounds.getSize(new THREE.Vector3());
  const lampHeight = bounds.min.y + size.y * (vehicle.truck ? 0.39 : 0.34);
  const frontZ = bounds.min.z + size.z * 0.035;
  const rearZ = bounds.max.z - size.z * 0.035;
  const headlightOffset = Math.min(vehicle.targetWidth * 0.3, size.x * 0.29);
  const tailOffset = Math.min(vehicle.targetWidth * 0.34, size.x * 0.32);
  group.userData.playerTailLights = [];
  group.userData.headlights = [];
  group.add(createContactShadow(vehicle));

  [-1, 1].forEach(function (side) {
    // The generated PBR model already contains the visible lamp housing. A
    // light source just inside the body gives it a natural glow without adding
    // a detached red box outside the car.
    const tailGlow = new THREE.PointLight(0xff3348, 0.48, 2.4, 2.5);
    tailGlow.position.set(side * tailOffset, lampHeight + 0.02, rearZ - 0.03);
    group.add(tailGlow);
    group.userData.playerTailLights.push(tailGlow);

    const target = new THREE.Object3D();
    target.position.set(side * headlightOffset * 0.38, 0.06, frontZ - 24);
    const headlight = new THREE.SpotLight(0xd9efff, 28, 55, Math.PI / 8.5, 0.78, 1.55);
    headlight.position.set(side * headlightOffset, lampHeight, frontZ);
    headlight.target = target;
    headlight.castShadow = true;
    headlight.shadow.mapSize.set(1024, 1024);
    headlight.shadow.bias = -0.00012;
    headlight.shadow.normalBias = 0.03;
    group.add(headlight, target);
    group.userData.headlights.push(headlight);
  });
  return group;
}

async function createPlayerVehicle(vehicle) {
  modelStatus.className = "model-status";
  modelStatus.textContent = "LOADING PBR 3D VEHICLE";
  try {
    const gltf = await warmVehicleModel(vehicle);
    const imported = normalizeImportedCar(gltf.scene, vehicle);
    const finishedModel = addPlayerLights(addVehicleAccessories(imported, vehicle), vehicle);
    modelStatus.className = "model-status ready";
    modelStatus.textContent = "ULTRA PBR · 4K SHADOWS · ACTIVE";
    return finishedModel;
  } catch (error) {
    console.warn("GLB model unavailable; using the local 3D fallback.", error);
    modelStatus.className = "model-status warn";
    modelStatus.textContent = "LOCAL 3D FALLBACK · GLB UNAVAILABLE";
    return addPlayerLights(createFallbackVehicle(vehicle), vehicle);
  }
}

function createCityScenery(side, index, map) {
  const group = new THREE.Group();
  const facade = getCityFacadeTexture();
  const buildingMaterials = [0, 1, 2].map(function (shade) {
    return getSceneryMaterial("city-building-" + shade, function () {
      return new THREE.MeshStandardMaterial({
        color: [0x68809a, 0x435a72, 0x8092a3][shade],
        map: facade,
        emissiveMap: facade,
        emissive: [0x162638, 0x0d1b2b, 0x192735][shade],
        emissiveIntensity: 0.48,
        roughness: 0.56,
        metalness: 0.22,
      });
    });
  });
  const roofMaterial = getSceneryMaterial("city-roof", function () { return makeMaterial(0x101820, 0.54, 0.48); });
  const sidewalkMaterial = getSceneryMaterial("city-sidewalk", function () { return makeMaterial(0x39434b, 0.88, 0.04); });
  const neonMaterial = getSceneryMaterial("city-neon", function () {
    return new THREE.MeshStandardMaterial({ color: map.accent, emissive: map.accent, emissiveIntensity: 3.4, roughness: 0.25 });
  });
  const baseX = side * (16.6 + (index % 3) * 1.2);
  const sidewalk = new THREE.Mesh(sceneryGeometry.cube, sidewalkMaterial);
  sidewalk.scale.set(10.5, 0.22, 18);
  sidewalk.position.set(side * 13.7, -0.02, 0);
  sidewalk.receiveShadow = true;
  group.add(sidewalk);

  for (let tower = 0; tower < 3; tower += 1) {
    const width = 4.2 + ((index * 7 + tower * 3) % 5) * 0.72;
    const height = 8.5 + ((index * 11 + tower * 7) % 9) * 1.55;
    const depth = 5.6 + ((index * 5 + tower * 2) % 4) * 1.25;
    const building = new THREE.Mesh(sceneryGeometry.cube, buildingMaterials[(index + tower) % buildingMaterials.length]);
    building.scale.set(width, height, depth);
    building.position.set(baseX + side * (tower * 5.1), height * 0.5 - 0.1, (tower - 1) * 8.8 + ((index + tower) % 3) * 1.2);
    building.castShadow = tower === 0;
    building.receiveShadow = true;
    group.add(building);

    const roof = new THREE.Mesh(sceneryGeometry.cube, roofMaterial);
    roof.scale.set(width * 0.36, 0.55 + (tower % 2) * 0.35, depth * 0.3);
    roof.position.set(building.position.x, height + roof.scale.y * 0.5 - 0.05, building.position.z);
    group.add(roof);

    if ((index + tower) % 3 === 0) {
      const aerial = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 3.2, 8), roofMaterial);
      aerial.position.set(building.position.x, height + 2.05, building.position.z);
      group.add(aerial);
    }
  }

  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.14, 0.08), neonMaterial);
  sign.position.set(side * 12.6, 2.1 + (index % 3) * 0.7, -4 + (index % 4) * 2.2);
  sign.rotation.z = side * 0.025;
  group.add(sign);
  return group;
}

function createCanyonScenery(side, index) {
  const group = new THREE.Group();
  const rockTextures = getCanyonRockTextures();
  const rockMaterials = [0, 1, 2].map(function (shade) {
    return getSceneryMaterial("canyon-natural-rock-" + shade, function () {
      return new THREE.MeshStandardMaterial({
        color: [0x84604f, 0x634a40, 0x9a715b][shade],
        map: rockTextures.color,
        bumpMap: rockTextures.relief,
        bumpScale: 0.1,
        roughness: 0.97,
        metalness: 0.01,
        flatShading: true,
      });
    });
  });
  const scrubMaterials = [0, 1].map(function (shade) {
    return getSceneryMaterial("canyon-natural-scrub-" + shade, function () {
      return new THREE.MeshStandardMaterial({ color: [0x77734b, 0x4f5e3d][shade], roughness: 1, flatShading: true });
    });
  });
  const cactusMaterials = [0, 1].map(function (shade) {
    return getSceneryMaterial("canyon-cactus-" + shade, function () {
      return new THREE.MeshStandardMaterial({
        color: [0x4f6842, 0x354c32][shade],
        roughness: 0.96,
        metalness: 0,
        flatShading: false,
      });
    });
  });
  const timberMaterial = getSceneryMaterial("canyon-utility-timber", function () { return makeMaterial(0x4a372b, 0.92, 0.02); });
  const cableMaterial = getSceneryMaterial("canyon-utility-cable", function () { return makeMaterial(0x242423, 0.62, 0.28); });

  const rockCount = index % 3 === 0 ? 3 : 2;
  for (let rockIndex = 0; rockIndex < rockCount; rockIndex += 1) {
    const isMesa = rockIndex === 0 && index % 2 === 0;
    const rockGeometry = isMesa
      ? sceneryGeometry.mesaFormations[(index + rockIndex) % sceneryGeometry.mesaFormations.length]
      : sceneryGeometry.rock;
    const rock = new THREE.Mesh(rockGeometry, rockMaterials[(index + rockIndex) % rockMaterials.length]);
    const scale = 1.25 + ((index * 3 + rockIndex * 5) % 5) * 0.28;
    const wide = 1.1 + ((index + rockIndex) % 3) * 0.18;
    rock.scale.set(
      scale * wide,
      scale * (isMesa ? 1.8 : 0.64 + (rockIndex % 2) * 0.22),
      scale * (0.92 + ((index + rockIndex) % 3) * 0.12),
    );
    rock.position.set(
      side * (15.2 + rockIndex * 3.8 + (index % 3) * 1.1),
      scale * (isMesa ? 0.88 : 0.42) - 0.1,
      -13 + rockIndex * 8.2 + (index % 4) * 1.1,
    );
    rock.rotation.set(rockIndex * 0.045, index * 0.43 + rockIndex * 0.77, (rockIndex % 2 ? -1 : 1) * 0.045);
    rock.castShadow = rockIndex === 0;
    rock.receiveShadow = true;
    group.add(rock);
  }

  if (index % 4 === 0) {
    const formation = new THREE.Mesh(
      sceneryGeometry.mesaFormations[index % sceneryGeometry.mesaFormations.length],
      rockMaterials[index % rockMaterials.length],
    );
    const formationHeight = 7.8 + (index % 5) * 1.15;
    formation.scale.set(6.8 + index % 4, formationHeight, 5.4 + index % 3);
    formation.position.set(side * (36 + (index % 4) * 5.2), formationHeight * 0.49 - 0.15, -11 + (index % 6) * 4.2);
    formation.rotation.set(0.01, index * 0.32 + side * 0.18, side * 0.018);
    formation.castShadow = false;
    formation.receiveShadow = true;
    group.add(formation);
  }

  const shrubCount = index % 4 === 1 ? 1 : 0;
  for (let shrubIndex = 0; shrubIndex < shrubCount; shrubIndex += 1) {
    const scrub = new THREE.Mesh(sceneryGeometry.shrub, scrubMaterials[(index + shrubIndex) % 2]);
    const shrubScale = 0.5 + ((index + shrubIndex * 2) % 4) * 0.13;
    scrub.scale.set(shrubScale * 1.45, shrubScale * 0.54, shrubScale);
    scrub.position.set(side * (13.6 + (index % 3) * 1.15), shrubScale * 0.28, -5 + (index % 4) * 4.1);
    scrub.rotation.y = index * 0.52 + shrubIndex;
    group.add(scrub);
  }

  if (index % 5 === 2) {
    const cactus = new THREE.Group();
    const cactusHeight = 2.25 + (index % 4) * 0.34;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, cactusHeight, 11), cactusMaterials[index % 2]);
    trunk.position.y = cactusHeight * 0.5;
    trunk.castShadow = true;
    cactus.add(trunk);
    [-1, 1].forEach(function (armSide, armIndex) {
      if ((index + armIndex) % 3 === 0) return;
      const armY = cactusHeight * (0.46 + armIndex * 0.17);
      const armLength = 0.5 + ((index + armIndex) % 3) * 0.12;
      const horizontal = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, armLength, 9), cactusMaterials[(index + armIndex) % 2]);
      horizontal.rotation.z = Math.PI / 2;
      horizontal.position.set(armSide * armLength * 0.42, armY, 0);
      const uprightHeight = 0.62 + armIndex * 0.16;
      const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, uprightHeight, 9), cactusMaterials[(index + armIndex) % 2]);
      upright.position.set(armSide * armLength * 0.78, armY + uprightHeight * 0.43, 0);
      cactus.add(horizontal, upright);
    });
    cactus.position.set(side * (14.2 + (index % 3) * 1.45), -0.08, 4 - (index % 4) * 3.6);
    cactus.rotation.y = index * 0.71;
    group.add(cactus);
  }

  if (side > 0 && index % 5 === 0) {
    const poleX = side * 13.2;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 5.9, 9), timberMaterial);
    pole.position.set(poleX, 2.83, 0);
    pole.castShadow = true;
    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.12, 0.12), timberMaterial);
    crossArm.position.set(poleX, 5.48, 0);
    group.add(pole, crossArm);
    [-0.62, 0, 0.62].forEach(function (offset) {
      const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 8), cableMaterial);
      insulator.position.set(poleX + offset, 5.62, 0);
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 28, 6), cableMaterial);
      wire.rotation.x = Math.PI / 2;
      wire.position.set(poleX + offset, 5.72, 0);
      group.add(insulator, wire);
    });
  }
  return group;
}

function createForestScenery(side, index) {
  const group = new THREE.Group();
  const branchDetailMaterials = Array.from({ length: 6 }, function (_, materialIndex) {
    const species = materialIndex < 3 ? 0 : 1;
    const shade = materialIndex % 3;
    return getSceneryMaterial("forest-needle-detail-" + species + "-" + shade, function () {
      return new THREE.MeshStandardMaterial({
        map: getPineTexture(species),
        color: [0xffffff, 0xd2d9d4, 0xe7eee9][shade],
        transparent: true,
        alphaTest: 0.22,
        side: THREE.DoubleSide,
        roughness: 1,
        metalness: 0,
        depthWrite: true,
      });
    });
  });
  const trunkMaterial = getSceneryMaterial("forest-natural-trunk", function () { return makeMaterial(0x4b392d, 0.98, 0); });
  const stoneMaterials = [0, 1].map(function (shade) {
    return getSceneryMaterial("forest-natural-stone-" + shade, function () {
      const granite = getAlpineGraniteTextures();
      return new THREE.MeshStandardMaterial({
        color: [0xb8c0bc, 0x8f9994][shade],
        map: granite.color,
        bumpMap: granite.relief,
        bumpScale: 0.12,
        roughness: 0.98,
        metalness: 0,
        flatShading: false,
      });
    });
  });
  const undergrowthMaterials = [0, 1].map(function (shade) {
    return getSceneryMaterial("forest-undergrowth-" + shade, function () {
      return new THREE.MeshStandardMaterial({ color: [0x536247, 0x344b3a][shade], roughness: 1, flatShading: true });
    });
  });

  // Irregular lathed crowns create a natural spruce outline, while crossed
  // needle cards keep small branch detail visible from every driving angle.
  const treeCount = 3 + (index % 2);
  for (let treeIndex = 0; treeIndex < treeCount; treeIndex += 1) {
    const species = (index + treeIndex) % 2;
    const height = (6.8 + ((index * 7 + treeIndex * 5) % 8) * 0.62) * (species ? 0.92 : 1);
    const width = height * (0.47 + ((index + treeIndex) % 3) * 0.03);
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(sceneryGeometry.trunk, trunkMaterial);
    trunk.scale.set(1.15, height * 0.34, 1.15);
    trunk.position.y = height * 0.17;
    trunk.castShadow = treeIndex === 0;
    tree.add(trunk);
    const crownRotation = index * 0.17 + treeIndex * 0.41;
    [0, 1, 2].forEach(function (planeIndex) {
      const branchDetail = new THREE.Mesh(
        sceneryGeometry.pinePlane,
        branchDetailMaterials[species * 3 + (index + treeIndex + planeIndex) % 3],
      );
      branchDetail.scale.set(width * (species ? 1.38 : 1.22), height * (species ? 0.98 : 1.02), 1);
      branchDetail.position.y = height * 0.51;
      branchDetail.rotation.y = crownRotation + planeIndex * Math.PI / 3 + Math.PI / 6;
      branchDetail.castShadow = treeIndex === 0 && planeIndex === 0;
      branchDetail.receiveShadow = true;
      tree.add(branchDetail);
    });
    tree.position.set(
      side * (12.9 + treeIndex * 3.75 + ((index + treeIndex) % 2) * 0.9),
      -0.1,
      -12 + treeIndex * 7.25 + ((index * 3 + treeIndex) % 3) * 0.8,
    );
    tree.rotation.y = index * 0.31 + treeIndex * 0.73;
    group.add(tree);
  }

  if (index % 3 === 0) {
    const mountainMaterial = getSceneryMaterial("forest-mountain", function () {
      const granite = getAlpineGraniteTextures();
      return new THREE.MeshStandardMaterial({
        color: 0xaeb9b4,
        map: granite.color,
        bumpMap: granite.relief,
        bumpScale: 0.2,
        roughness: 1,
        metalness: 0,
        flatShading: false,
      });
    });
    const mountain = new THREE.Mesh(sceneryGeometry.mountains[index % sceneryGeometry.mountains.length], mountainMaterial);
    mountain.scale.set(13 + index % 5, 10 + index % 4, 12 + index % 3);
    mountain.position.set(side * (39 + index % 4 * 3), 5.5, -8 + index % 5 * 3.2);
    mountain.rotation.set(0.08, index * 0.31, side * 0.04);
    mountain.receiveShadow = true;
    group.add(mountain);
  }

  const forestRockCount = index % 3 === 0 ? 1 : 0;
  for (let rockIndex = 0; rockIndex < forestRockCount; rockIndex += 1) {
    const rock = new THREE.Mesh(sceneryGeometry.rock, stoneMaterials[(index + rockIndex) % 2]);
    const rockScale = 0.55 + ((index + rockIndex * 3) % 4) * 0.18;
    rock.scale.set(rockScale * 1.28, rockScale * 0.62, rockScale);
    rock.position.set(side * (13.45 + rockIndex * 4.2), rockScale * 0.42, -6 + rockIndex * 11.4 + (index % 3));
    rock.rotation.set(0.12 * rockIndex, index * 0.61 + rockIndex, -0.08 * (rockIndex % 2));
    rock.castShadow = rockIndex === 0;
    group.add(rock);
  }
  const forestShrubCount = index % 2 ? 1 : 0;
  for (let shrubIndex = 0; shrubIndex < forestShrubCount; shrubIndex += 1) {
    const shrub = new THREE.Mesh(sceneryGeometry.shrub, undergrowthMaterials[(index + shrubIndex) % 2]);
    const shrubScale = 0.5 + ((index + shrubIndex) % 3) * 0.14;
    shrub.scale.set(shrubScale * 1.3, shrubScale * 0.65, shrubScale);
    shrub.position.set(side * (12.9 + shrubIndex * 3.3), shrubScale * 0.32, -11 + shrubIndex * 8.8);
    shrub.rotation.y = index * 0.4 + shrubIndex;
    group.add(shrub);
  }
  return group;
}

function createRoadsideMotionProps(side, index, map) {
  const group = new THREE.Group();
  group.userData.isMotionProp = true;
  group.userData.side = side;
  group.userData.seed = index;
  group.userData.baseX = side * (10.75 + (index % 3) * 0.42);
  const dark = getSceneryMaterial("motion-dark", function () { return makeMaterial(0x1b2329, 0.58, 0.38); });
  const metal = getSceneryMaterial("motion-metal", function () { return makeMaterial(0xaab3b8, 0.42, 0.66); });
  const glow = getSceneryMaterial("motion-glow-" + map.id, function () {
    return new THREE.MeshStandardMaterial({ color: map.accent, emissive: map.accent, emissiveIntensity: 2.1, roughness: 0.26 });
  });

  if (map.scenery === "city") {
    const shelter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.15, 0.16), dark);
    shelter.position.set(group.userData.baseX, 1.08, 0);
    shelter.castShadow = true;
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(1.92, 1.54, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x8fc5da, emissive: 0x16445a, emissiveIntensity: 0.52, roughness: 0.16, metalness: 0.24, transparent: true, opacity: 0.66 }),
    );
    glass.position.set(group.userData.baseX, 1.08, side * -0.13);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.09, 0.05), glow);
    panel.position.set(group.userData.baseX, 1.78, side * -0.2);
    group.add(shelter, glass, panel);
  } else if (map.scenery === "canyon") {
    const naturalRockTextures = getCanyonRockTextures();
    const roadsideRockMaterial = getSceneryMaterial("motion-canyon-rock-v35", function () {
      return new THREE.MeshStandardMaterial({
        color: 0x755446,
        map: naturalRockTextures.color,
        bumpMap: naturalRockTextures.relief,
        bumpScale: 0.11,
        roughness: 0.98,
        flatShading: true,
      });
    });
    const roadsideRockCount = 0;
    for (let item = 0; item < roadsideRockCount; item += 1) {
      const rock = new THREE.Mesh(sceneryGeometry.rock, roadsideRockMaterial);
      const size = 0.58 + ((index + item * 3) % 4) * 0.16;
      rock.scale.set(size * 1.35, size * 0.66, size);
      rock.position.set(side * (13.8 + (index % 3) * 1.35), size * 0.46, -2.8 + (index % 4) * 2.4);
      rock.rotation.set(item * 0.18, index * 0.47 + item, item * -0.12);
      rock.castShadow = true;
      group.add(rock);
    }
    const delineator = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.28, 0.09), metal);
    delineator.position.set(side * 10.95, 0.63, 4.4);
    const amberReflector = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.055), glow);
    amberReflector.position.set(side * 10.9, 1.02, 4.34);
    group.add(delineator, amberReflector);
  } else {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.2, 10), getSceneryMaterial("motion-log", function () {
      return makeMaterial(0x4a3022, 0.96, 0);
    }));
    trunk.rotation.z = Math.PI / 2;
    trunk.position.set(side * 11.35, 0.35, -0.8);
    trunk.castShadow = true;
    const routePost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.1, 0.1), metal);
    routePost.position.set(side * 10.95, 1.04, 4.3);
    const routePanel = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.68, 0.11),
      new THREE.MeshStandardMaterial({ color: 0x172c25, emissive: 0x071b14, emissiveIntensity: 0.44, roughness: 0.5, metalness: 0.24 }),
    );
    routePanel.position.set(side * 10.95, 1.76, 4.3);
    const routeStripe = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.055, 0.025), glow);
    routeStripe.position.set(side * 10.95, 1.81, 4.368);
    const routeCode = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.045, 0.026), glow);
    routeCode.position.set(side * 11.16, 1.63, 4.369);
    group.add(trunk, routePost, routePanel, routeStripe, routeCode);
  }
  group.position.z = -13 + (index * 11) % 26;
  group.userData.baseZ = group.position.z;
  return group;
}

function disposeAtmosphere() {
  atmosphereWorld.traverse(function (object) {
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
  });
  atmosphereWorld.clear();
  atmosphereLayers.length = 0;
}

function buildAtmosphere(map) {
  disposeAtmosphere();
  const isCity = map.scenery === "city";
  const layerCount = isCity ? 2 : 3;
  for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
    const count = isCity ? 150 - layerIndex * 34 : 210 - layerIndex * 35;
    if (isCity) {
      const positions = new Float32Array(count * 6);
      for (let index = 0; index < count; index += 1) {
        const offset = index * 6;
        const x = (Math.random() - 0.5) * (42 + layerIndex * 18);
        const y = 1.2 + Math.random() * 19;
        const z = 18 - Math.random() * 330;
        positions[offset] = x;
        positions[offset + 1] = y;
        positions[offset + 2] = z;
        positions[offset + 3] = x - 0.09;
        positions[offset + 4] = y + 0.65 + layerIndex * 0.24;
        positions[offset + 5] = z - 0.72 - layerIndex * 0.35;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.LineBasicMaterial({
        color: layerIndex ? 0x8bb9d3 : 0xd6f2ff,
        transparent: true,
        opacity: layerIndex ? 0.13 : 0.23,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const rain = new THREE.LineSegments(geometry, material);
      rain.frustumCulled = false;
      rain.userData.kind = "rain";
      rain.userData.layer = layerIndex;
      atmosphereWorld.add(rain);
      atmosphereLayers.push(rain);
    } else {
      const positions = new Float32Array(count * 3);
      const phases = new Float32Array(count);
      for (let index = 0; index < count; index += 1) {
        const offset = index * 3;
        positions[offset] = (Math.random() - 0.5) * (48 + layerIndex * 17);
        positions[offset + 1] = 0.35 + Math.random() * (map.scenery === "forest" ? 12 : 8);
        positions[offset + 2] = 18 - Math.random() * 350;
        phases[index] = Math.random() * Math.PI * 2;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: map.scenery === "canyon" ? (layerIndex ? 0xffbe7a : 0xffe1b3) : (layerIndex ? 0x9bd7be : 0xe0fff0),
        map: getSoftParticleTexture(),
        alphaMap: getSoftParticleTexture(),
        size: (map.scenery === "canyon" ? 0.09 : 0.072) + layerIndex * 0.035,
        transparent: true,
        opacity: 0.22 - layerIndex * 0.035,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const particles = new THREE.Points(geometry, material);
      particles.frustumCulled = false;
      particles.userData.kind = map.scenery === "canyon" ? "dust" : "pollen";
      particles.userData.layer = layerIndex;
      particles.userData.phases = phases;
      atmosphereWorld.add(particles);
      atmosphereLayers.push(particles);
    }
  }

  if (!isCity) {
    const cloudCount = map.scenery === "canyon" ? 24 : 18;
    const positions = new Float32Array(cloudCount * 3);
    const phases = new Float32Array(cloudCount);
    for (let index = 0; index < cloudCount; index += 1) {
      const offset = index * 3;
      positions[offset] = (Math.random() - 0.5) * 170;
      positions[offset + 1] = 17 + Math.random() * 17;
      positions[offset + 2] = 35 - Math.random() * 390;
      phases[index] = Math.random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: map.scenery === "canyon" ? 0xffd3ae : 0xe6f2ee,
      map: getSoftParticleTexture(),
      alphaMap: getSoftParticleTexture(),
      size: map.scenery === "canyon" ? 18 : 14,
      transparent: true,
      opacity: map.scenery === "canyon" ? 0.1 : 0.075,
      blending: THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const clouds = new THREE.Points(geometry, material);
    clouds.frustumCulled = false;
    clouds.userData.kind = "cloud";
    clouds.userData.layer = 0;
    clouds.userData.phases = phases;
    atmosphereWorld.add(clouds);
    atmosphereLayers.push(clouds);
  }

  const hazeMaterial = new THREE.SpriteMaterial({
    color: map.scenery === "city" ? 0x5aa7d7 : map.scenery === "canyon" ? 0xffa16f : 0x9dcdbd,
    map: getSoftParticleTexture(),
    transparent: true,
    opacity: map.scenery === "city" ? 0.052 : 0.065,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: true,
  });
  for (let layer = 0; layer < 7; layer += 1) {
    const haze = new THREE.Sprite(hazeMaterial.clone());
    haze.position.set((layer % 2 ? -1 : 1) * (12 + layer * 7.5), 5.5 + layer * 1.1, -92 - layer * 44);
    haze.scale.set(58 + layer * 11, 15 + layer * 2.7, 1);
    haze.material.opacity *= 1 - layer * 0.065;
    atmosphereWorld.add(haze);
  }
}

function createRouteLandmark(map, index) {
  const landmark = new THREE.Group();
  landmark.userData.isRouteLandmark = true;
  landmark.userData.seed = index;
  landmark.userData.lastAnnouncedCycle = -1;
  const structure = new THREE.MeshStandardMaterial({
    color: map.scenery === "city" ? 0x182837 : map.scenery === "canyon" ? 0x793f2c : 0x263d34,
    roughness: map.scenery === "city" ? 0.36 : 0.86,
    metalness: map.scenery === "city" ? 0.7 : 0.08,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: map.accent,
    emissive: map.accent,
    emissiveIntensity: map.scenery === "city" ? 5.2 : 2.8,
    roughness: 0.2,
    metalness: 0.25,
  });
  glow.userData.baseIntensity = glow.emissiveIntensity;
  glow.userData.phase = index * 0.71;
  animatedLandmarkMaterials.push(glow);

  if (map.scenery === "city") {
    landmark.userData.label = index % 2 ? "AURORA GATE" : "NEON DISTRICT";
    [-1, 1].forEach(function (side) {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.78, 7.5, 1.15), structure);
      pylon.position.set(side * 10.25, 3.62, 0);
      pylon.castShadow = true;
      landmark.add(pylon);
      [1.2, 3.15, 5.15].forEach(function (height, stripIndex) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.09, 1.3), glow);
        strip.position.set(side * 10.25, height, stripIndex % 2 ? 0.18 : -0.18);
        landmark.add(strip);
      });
    });
    const crown = new THREE.Mesh(new THREE.BoxGeometry(20.4, 0.45, 1.18), structure);
    crown.position.y = 7.08;
    crown.castShadow = true;
    landmark.add(crown);
    for (let stripIndex = -4; stripIndex <= 4; stripIndex += 1) {
      const crownLight = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.1, 1.32), glow);
      crownLight.position.set(stripIndex * 2.05, 6.82, 0);
      landmark.add(crownLight);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.07, 8, 46), glow);
    ring.position.set(index % 2 ? -3.25 : 3.25, 6.02, -0.7);
    ring.userData.spin = true;
    landmark.add(ring);
  } else if (map.scenery === "canyon") {
    landmark.userData.label = index % 2 ? "SUNSTONE PASS" : "RED ROCK PASS";
    const rockTextures = getCanyonRockTextures();
    structure.map = rockTextures.color;
    structure.bumpMap = rockTextures.relief;
    structure.bumpScale = 0.16;
    // One-sided, irregular outcrops avoid the artificial mirrored gateway
    // silhouette while still creating a memorable moving landmark.
    const cliffSide = index % 2 ? -1 : 1;
    const ledge = new THREE.Mesh(sceneryGeometry.rock, structure);
    ledge.scale.set(5.6, 1.35, 4.8);
    ledge.position.set(cliffSide * 20.4, 0.58, 1.4);
    ledge.rotation.set(-0.06, cliffSide * 0.91, cliffSide * -0.12);
    ledge.castShadow = true;
    const lowerLedge = new THREE.Mesh(sceneryGeometry.rock, structure);
    lowerLedge.scale.set(3.4, 0.88, 3.25);
    lowerLedge.position.set(cliffSide * 16.8, 0.36, -2.2);
    lowerLedge.rotation.set(0.08, cliffSide * 0.44, cliffSide * 0.08);
    lowerLedge.castShadow = true;
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.06), glow);
    marker.position.set(-cliffSide * 10.15, 0.7, -1.5);
    landmark.add(ledge, lowerLedge, marker);
  } else {
    landmark.userData.label = index % 2 ? "EVERGREEN PASS" : "ALPINE SUNRISE";
    // A forest clearing now replaces the previous sci-fi overhead gate.
    // The paired clusters remain well outside the asphalt and move in full 3D.
    [-1, 1].forEach(function (side) {
      const grove = createForestScenery(side, index * 3 + (side > 0 ? 1 : 0));
      grove.scale.setScalar(side < 0 ? 1.2 : 1.05);
      grove.position.z = side < 0 ? -2.4 : 2.2;
      landmark.add(grove);
      const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.22, 0.05), glow);
      reflector.position.set(side * 10.1, 0.72, side < 0 ? -0.8 : 0.9);
      landmark.add(reflector);
    });
  }

  landmark.position.z = -2;
  landmark.userData.baseZ = landmark.position.z;
  routeLandmarks.push(landmark);
  return landmark;
}

function updateAtmosphere(dt, time, travel) {
  atmosphereLayers.forEach(function (layer) {
    const positions = layer.geometry.attributes.position.array;
    if (layer.userData.kind === "rain") {
      for (let offset = 0; offset < positions.length; offset += 6) {
        positions[offset + 1] -= dt * (7.5 + layer.userData.layer * 2.1);
        positions[offset + 4] -= dt * (7.5 + layer.userData.layer * 2.1);
        positions[offset + 2] += travel * (1.35 + layer.userData.layer * 0.18);
        positions[offset + 5] += travel * (1.35 + layer.userData.layer * 0.18);
        if (positions[offset + 2] > 24 || positions[offset + 1] < 0.15) {
          const x = (Math.random() - 0.5) * (44 + layer.userData.layer * 18);
          const y = 8 + Math.random() * 14;
          const z = -240 - Math.random() * 110;
          positions[offset] = x;
          positions[offset + 1] = y;
          positions[offset + 2] = z;
          positions[offset + 3] = x - 0.09;
          positions[offset + 4] = y + 0.65 + layer.userData.layer * 0.24;
          positions[offset + 5] = z - 0.72 - layer.userData.layer * 0.35;
        }
      }
    } else {
      const phases = layer.userData.phases;
      const isCloud = layer.userData.kind === "cloud";
      for (let offset = 0, point = 0; offset < positions.length; offset += 3, point += 1) {
        positions[offset + 2] += travel * (isCloud ? 0.055 : 0.78 + layer.userData.layer * 0.12);
        positions[offset] += Math.sin(time * (isCloud ? 0.08 : 0.65) + phases[point]) * dt * (isCloud ? 0.24 : layer.userData.kind === "dust" ? 0.34 : 0.18);
        positions[offset + 1] += Math.sin(time * (isCloud ? 0.12 : 0.9) + phases[point] * 1.7) * dt * (isCloud ? 0.025 : 0.08);
        if (positions[offset + 2] > (isCloud ? 55 : 24)) {
          positions[offset + 2] = -300 - Math.random() * 70;
          positions[offset] = (Math.random() - 0.5) * (isCloud ? 170 : 50 + layer.userData.layer * 16);
          positions[offset + 1] = isCloud ? 17 + Math.random() * 17 : 0.35 + Math.random() * (layer.userData.kind === "dust" ? 8 : 12);
        }
      }
    }
    layer.geometry.attributes.position.needsUpdate = true;
  });
}

function triggerRouteMoment(landmark) {
  const race = state.race;
  if (!race || race.finishPending || race.finished) return;
  race.visualPulse = 1;
  addScore(180, 0.05);
  showToast(landmark.userData.label + " · ROUTE MOMENT", false, "◇");
  screens.game.classList.remove("route-moment");
  void screens.game.offsetWidth;
  screens.game.classList.add("route-moment");
  window.setTimeout(function () { screens.game.classList.remove("route-moment"); }, 1100);
}

function buildRoad(map) {
  roadWorld.clear();
  roadSegments.length = 0;
  routeLandmarks.length = 0;
  animatedLandmarkMaterials.length = 0;
  currentMapTheme = map.id;
  buildAtmosphere(map);
  applyMapBackdrop(map);
  scene.environment = createReflectionEnvironment(map);
  scene.fog = new THREE.FogExp2(map.fog, map.fogDensity);
  hemisphere.color.set(map.scenery === "canyon" ? 0xffc7a2 : map.scenery === "forest" ? 0xc9eee5 : 0xbfe8ff);
  hemisphere.groundColor.set(map.scenery === "forest" ? 0x10251f : map.scenery === "canyon" ? 0x342019 : 0x0b1320);
  sun.color.set(map.scenery === "canyon" ? 0xffb584 : map.scenery === "forest" ? 0xd9fff0 : 0xe7f6ff);
  sun.intensity = map.scenery === "city" ? 2.35 : map.scenery === "canyon" ? 3.65 : 3.05;
  sun.position.set(map.scenery === "canyon" ? -18 : -12, map.scenery === "city" ? 20 : 24, map.scenery === "forest" ? -8 : 10);
  roadFill.color.set(map.scenery === "canyon" ? 0xffa777 : map.scenery === "forest" ? 0x99e2d0 : 0x78cfff);
  roadFill.intensity = map.scenery === "city" ? 1.55 : 0.95;
  vehicleRim.color.set(map.scenery === "city" ? 0x82dfff : map.scenery === "canyon" ? 0xff9f70 : 0xc4ffd9);
  vehicleRim.intensity = map.scenery === "city" ? 1.45 : 1.05;
  renderer.toneMappingExposure = map.scenery === "city" ? 1.12 : map.scenery === "canyon" ? 1.06 : 1.1;

  const roadMaterial = new THREE.MeshPhysicalMaterial({
    color: map.scenery === "city" ? 0x0b1219 : map.road,
    roughness: map.scenery === "city" ? 0.38 : map.scenery === "forest" ? 0.69 : 0.82,
    metalness: map.scenery === "city" ? 0.16 : 0.035,
    clearcoat: map.scenery === "city" ? 0.66 : 0.12,
    clearcoatRoughness: map.scenery === "city" ? 0.3 : 0.68,
    envMapIntensity: map.scenery === "city" ? 1.18 : 0.58,
  });
  roadMaterial.map = createAsphaltTexture(map.scenery === "city");
  roadMaterial.bumpMap = createAsphaltReliefTexture(map.scenery === "city");
  roadMaterial.bumpScale = map.scenery === "city" ? 0.075 : 0.095;
  const shoulderMaterial = makeMaterial(map.shoulder, 0.93, 0.02);
  shoulderMaterial.map = createTerrainTexture(map);
  if (map.scenery === "forest") {
    shoulderMaterial.bumpMap = getForestFloorTextures().relief;
    shoulderMaterial.bumpScale = 0.11;
  }
  shoulderMaterial.envMapIntensity = 0.42;
  const lineMaterial = new THREE.MeshStandardMaterial({
    color: map.line,
    roughness: 0.45,
    emissive: map.scenery === "city" ? 0x193e53 : 0x000000,
    emissiveIntensity: map.scenery === "city" ? 0.36 : 0.08,
  });
  const railMaterial = makeMaterial(0xbac1c8, 0.34, 0.72);
  const postMaterial = makeMaterial(0x858d95, 0.46, 0.64);
  const reflectorMaterial = new THREE.MeshStandardMaterial({
    color: map.scenery === "city" ? 0xe9f4ff : 0xffe7aa,
    emissive: map.scenery === "city" ? 0x7bb6e8 : 0xc97c25,
    emissiveIntensity: map.scenery === "city" ? 1.45 : 0.72,
    roughness: 0.28,
  });
  const edgeGlowMaterial = new THREE.MeshStandardMaterial({
    color: map.accent,
    emissive: map.accent,
    emissiveIntensity: map.scenery === "city" ? 0.62 : 0.28,
    roughness: 0.34,
    metalness: 0.2,
  });
  const roadWearMaterial = new THREE.MeshStandardMaterial({
    color: map.scenery === "city" ? 0x0c1117 : 0x121315,
    roughness: 0.96,
    metalness: 0,
    transparent: true,
    opacity: map.scenery === "city" ? 0.035 : 0.07,
    depthWrite: false,
  });
  const rumbleStripMaterial = new THREE.MeshStandardMaterial({
    color: map.scenery === "canyon" ? 0xb56343 : 0xd7d7cd,
    roughness: 0.72,
    metalness: 0.02,
  });
  const roadWearGeometry = new THREE.PlaneGeometry(0.42, SEGMENT_LENGTH + 0.7);
  const rumbleGeometry = new THREE.BoxGeometry(0.3, 0.026, 1.35);
  const wetReflectionGeometry = new THREE.PlaneGeometry(0.68, SEGMENT_LENGTH + 0.65);
  const wetReflectionMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x8dcff0,
    roughness: 0.12,
    metalness: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.055,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lampPoolGeometry = new THREE.CircleGeometry(1, 28);
  const lampPoolMaterials = [0x86dfff, 0xffca83].map(function (color) {
    return new THREE.MeshBasicMaterial({
      color,
      map: getSoftParticleTexture(),
      transparent: true,
      opacity: 0.085,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  });
  const lampHaloMaterials = [0x9ee9ff, 0xffd39a].map(function (color) {
    return new THREE.SpriteMaterial({
      color,
      map: getSoftParticleTexture(),
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  });
  const beaconMaterial = new THREE.MeshBasicMaterial({ color: map.accent });
  const signMaterial = new THREE.MeshStandardMaterial({
    color: map.scenery === "canyon" ? 0x5e2e22 : map.scenery === "forest" ? 0x173f31 : 0x172c43,
    emissive: map.scenery === "city" ? 0x071424 : 0x000000,
    emissiveIntensity: 0.85,
    roughness: 0.48,
    metalness: 0.24,
  });

  for (let index = 0; index < SEGMENT_COUNT; index += 1) {
    const segment = new THREE.Group();
    segment.position.z = 16 - index * SEGMENT_LENGTH;
    segment.userData.cycle = 0;
    const road = new THREE.Mesh(new THREE.BoxGeometry(18, 0.16, SEGMENT_LENGTH + 1.2), roadMaterial);
    road.position.y = -0.12;
    road.receiveShadow = true;
    segment.add(road);

    const repairMaterial = new THREE.MeshStandardMaterial({
      color: map.scenery === "city" ? 0x11171d : 0x252221,
      roughness: 0.82,
      metalness: map.scenery === "city" ? 0.2 : 0.02,
      transparent: true,
      opacity: 0.36,
    });
    if (index % 3 !== 1) {
      const repair = new THREE.Mesh(new THREE.PlaneGeometry(2.2 + index % 4, 7.5 + index % 5), repairMaterial);
      repair.rotation.x = -Math.PI / 2;
      repair.position.set(index % 2 ? -3.8 : 3.2, 0.004, index % 2 ? -8 : 10);
      repair.rotation.y = (index % 3 - 1) * 0.05;
      segment.add(repair);
    }

    LANE_X.forEach(function (laneX) {
      [-0.72, 0.72].forEach(function (wheelOffset) {
        const wear = new THREE.Mesh(roadWearGeometry, roadWearMaterial);
        wear.rotation.x = -Math.PI / 2;
        wear.position.set(laneX + wheelOffset, 0.006, 0);
        segment.add(wear);
      });
    });

    if (map.scenery === "city") {
      LANE_X.forEach(function (laneX, laneIndex) {
        const reflection = new THREE.Mesh(wetReflectionGeometry, wetReflectionMaterial);
        reflection.rotation.x = -Math.PI / 2;
        reflection.position.set(laneX + (laneIndex - 1) * 0.18, 0.012, 0);
        reflection.scale.x = laneIndex === 1 ? 1.35 : 0.9;
        segment.add(reflection);
      });
    }

    if (map.scenery === "city" && index % 2 === 0) {
      [-1, 1].forEach(function (side) {
        const wetPatch = new THREE.Mesh(
          new THREE.PlaneGeometry(1.5 + index % 3, 5.6 + index % 4),
          new THREE.MeshStandardMaterial({ color: 0x294d64, roughness: 0.18, metalness: 0.42, transparent: true, opacity: 0.13 }),
        );
        wetPatch.rotation.x = -Math.PI / 2;
        wetPatch.position.set(side * (6.2 + index % 2), 0.006, index % 4 * 5 - 9);
        segment.add(wetPatch);
      });
    }

    [-1, 1].forEach(function (side) {
      const shoulderWidth = map.scenery === "city" ? 8 : 5.8;
      const shoulderCenter = 9 + shoulderWidth * 0.5;
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(shoulderWidth, 0.12, SEGMENT_LENGTH + 1.2), shoulderMaterial);
      shoulder.position.set(side * shoulderCenter, -0.17, 0);
      shoulder.receiveShadow = true;
      segment.add(shoulder);
      if (map.scenery === "city") {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.28, SEGMENT_LENGTH + 1.1), makeMaterial(0x27313a, 0.66, 0.12));
        curb.position.set(side * 11.15, 0.02, 0);
        curb.receiveShadow = true;
        segment.add(curb);
      }
      const edgeLine = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.03, SEGMENT_LENGTH + 0.9), lineMaterial);
      edgeLine.position.set(side * 8.55, 0.012, 0);
      segment.add(edgeLine);
      const edgeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, SEGMENT_LENGTH + 0.75), edgeGlowMaterial);
      edgeGlow.position.set(side * 8.82, 0.018, 0);
      segment.add(edgeGlow);
      if (map.scenery !== "city") {
        const rumbleStrip = new THREE.InstancedMesh(rumbleGeometry, rumbleStripMaterial, 9);
        const rumbleMatrix = new THREE.Matrix4();
        for (let rumbleIndex = 0; rumbleIndex < 9; rumbleIndex += 1) {
          rumbleMatrix.makeTranslation(side * 8.93, 0.026, -18 + rumbleIndex * 4.5);
          rumbleStrip.setMatrixAt(rumbleIndex, rumbleMatrix);
        }
        rumbleStrip.instanceMatrix.needsUpdate = true;
        rumbleStrip.receiveShadow = true;
        segment.add(rumbleStrip);
      }
      if (index % 2 === 0) {
        for (let marker = -16; marker <= 16; marker += 8) {
          const roadStud = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.22), reflectorMaterial);
          roadStud.position.set(side * 8.28, 0.026, marker);
          roadStud.rotation.y = side * 0.04;
          segment.add(roadStud);
        }
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, SEGMENT_LENGTH + 0.8), railMaterial);
      rail.position.set(side * 9.7, 0.62, 0);
      rail.castShadow = true;
      segment.add(rail);
      [-16, -6, 4, 14].forEach(function (z) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.78, 0.16), postMaterial);
        post.position.set(side * 9.7, 0.28, z);
        post.castShadow = true;
        const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.055), reflectorMaterial);
        reflector.position.set(side * 9.61, 0.58, z + 0.02);
        segment.add(post, reflector);
      });
      const archivePost = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.55, 0.08), postMaterial);
      archivePost.position.set(side * 10.35, 0.77, -13.5);
      const archiveBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.22), beaconMaterial);
      archiveBeacon.position.set(side * 10.35, 1.58, -13.5);
      segment.add(archivePost, archiveBeacon);

      if (map.scenery === "city") {
        [-13, 10].forEach(function (z, lampIndex) {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 5.5, 10), postMaterial);
          pole.position.set(side * 10.55, 2.72, z);
          pole.castShadow = true;
          const arm = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.07, 0.07), postMaterial);
          arm.position.set(side * 10.05, 5.39, z);
          const lamp = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.12, 0.24),
            new THREE.MeshStandardMaterial({ color: 0xe5f2ff, emissive: lampIndex ? 0xffce91 : 0x9fdfff, emissiveIntensity: 4.2, roughness: 0.18 }),
          );
          lamp.position.set(side * 9.55, 5.32, z);
          const halo = new THREE.Sprite(lampHaloMaterials[lampIndex]);
          halo.position.copy(lamp.position);
          halo.scale.set(1.45, 1.45, 1.45);
          segment.add(pole, arm, lamp, halo);
          if (index % 2 === 0) {
            const lightPool = new THREE.Mesh(lampPoolGeometry, lampPoolMaterials[lampIndex]);
            lightPool.rotation.x = -Math.PI / 2;
            lightPool.position.set(side * 8.15, 0.024, z);
            lightPool.scale.set(2.5, 5.4, 1);
            segment.add(lightPool);
          }
        });
      }
      if ((index + (side > 0 ? 1 : 0)) % 2 === 0) {
        segment.add(createRoadsideMotionProps(side, index * 3 + (side > 0 ? 1 : 0), map));
      }
    });

    [-2.55, 2.55].forEach(function (laneX) {
      for (let dash = 0; dash < 6; dash += 1) {
        const mark = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 3.4), lineMaterial);
        mark.position.set(laneX, 0.01, -SEGMENT_LENGTH / 2 + 4 + dash * 7);
        segment.add(mark);
        if (dash % 2 === 0) {
          const laneBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.035, 0.16), edgeGlowMaterial);
          laneBeacon.position.set(laneX, 0.025, mark.position.z + 2.25);
          segment.add(laneBeacon);
        }
      }
    });

    for (let side = -1; side <= 1; side += 2) {
      for (let item = 0; item < 2; item += 1) {
        const seed = index * 5 + item * 2 + (side > 0 ? 1 : 0);
        let scenery;
        if (map.scenery === "city") scenery = createCityScenery(side, seed, map);
        else if (map.scenery === "canyon") scenery = createCanyonScenery(side, seed);
        else scenery = createForestScenery(side, seed);
        scenery.userData.isSceneryCluster = true;
        scenery.userData.side = side;
        scenery.userData.seed = seed;
        scenery.position.z += item ? 9 : -10;
        scenery.userData.baseZ = scenery.position.z;
        segment.add(scenery);
      }
    }

    if (index % 5 === 2) {
      const gantry = new THREE.Group();
      [-1, 1].forEach(function (side) {
        const support = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.8, 0.18), postMaterial);
        support.position.set(side * 9.25, 2.78, 0);
        support.castShadow = true;
        gantry.add(support);
      });
      const beam = new THREE.Mesh(new THREE.BoxGeometry(18.7, 0.2, 0.2), postMaterial);
      beam.position.y = 5.58;
      const sign = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.12, 0.14), signMaterial);
      sign.position.set(index % 2 ? -3.2 : 3.2, 5.06, 0.08);
      sign.castShadow = true;
      gantry.add(beam, sign);
      [-1.6, 0, 1.6].forEach(function (x) {
        const guide = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.055, 0.035), reflectorMaterial);
        guide.position.set(sign.position.x + x, 5.05, 0.17);
        gantry.add(guide);
      });
      gantry.position.z = -8;
      segment.add(gantry);
    }

    if (index % 5 === 3) {
      const landmark = createRouteLandmark(map, index);
      segment.userData.landmark = landmark;
      segment.add(landmark);
    }

    roadWorld.add(segment);
    roadSegments.push(segment);
  }
  currentMapTheme = map.id;
}

function createTrafficVehicle(index, playerVehicleId) {
  const palette = [0x152337, 0xc8d1d3, 0x8f2830, 0x2c6577, 0xb7783d, 0x1c222a];
  const archiveEntry = getTrafficCollectionVehicle(index, playerVehicleId);
  const collectionVehicle = archiveEntry ? vehicles[archiveEntry.vehicleId] : null;
  const template = collectionVehicle || { color: palette[index % palette.length], truck: index % 5 === 0 || index % 9 === 6 };
  const car = collectionVehicle
    ? trafficModelPrototypes.get(collectionVehicle.id).clone(true)
    : createFallbackVehicle({ color: template.color, truck: template.truck }, template.color);
  if (collectionVehicle) {
    const collectionScale = 0.96 + (index % 3) * 0.015;
    car.scale.multiplyScalar(collectionScale);
    car.userData.collectionSlot = archiveEntry.slot;
    car.userData.collectionVehicleId = collectionVehicle.id;
  } else {
    const scale = template.truck ? 0.86 : 0.79 + (index % 3) * 0.04;
    const widthVariation = template.truck ? 1.02 : 0.92 + (index % 4) * 0.035;
    const lengthVariation = template.truck ? 1.08 : 0.94 + ((index + 2) % 3) * 0.04;
    car.scale.set(scale * widthVariation, scale, scale * lengthVariation);
  }
  car.userData.speed = 58 + (index * 17) % 74;
  car.userData.cruiseSpeed = car.userData.speed;
  car.userData.isTrafficTruck = template.truck;
  car.userData.lane = index % 3;
  car.userData.targetLane = index % 3;
  car.userData.laneX = LANE_X[index % 3];
  car.userData.changeTimer = 1.5 + (index % 4) * 0.8;
  car.userData.cooldown = 0;
  car.userData.photoCycle = 0;
  car.userData.photoId = (car.userData.collectionVehicleId || "traffic") + "-" + index + "-0";
  return car;
}

function trafficLaneIsClear(car, lane) {
  return trafficCars.every(function (other) {
    if (other === car || other.userData.targetLane !== lane) return true;
    return Math.abs(other.position.z - car.position.z) > (other.userData.isTrafficTruck || car.userData.isTrafficTruck ? 29 : 23);
  });
}

function updateTrafficRadar() {
  if (!state.race) return;
  const visible = trafficCars
    .map(function (car) { return { car, distance: PLAYER_Z - car.position.z }; })
    .filter(function (item) { return item.distance > -10 && item.distance < 285; })
    .sort(function (a, b) { return a.distance - b.distance; })
    .slice(0, radarMarkers.length);
  radarMarkers.forEach(function (marker, index) {
    const item = visible[index];
    if (!item) {
      marker.style.display = "none";
      return;
    }
    const laneRatio = THREE.MathUtils.clamp((item.car.position.x + 5.1) / 10.2, 0, 1);
    const distanceRatio = THREE.MathUtils.clamp(item.distance / 285, 0, 1);
    marker.style.display = "block";
    marker.style.left = (17 + laneRatio * 66) + "%";
    marker.style.top = (77 - distanceRatio * 69) + "%";
    marker.classList.toggle("truck", item.car.userData.isTrafficTruck);
    marker.classList.toggle("near", item.distance < 58);
  });
}

function buildTraffic(map, playerVehicleId) {
  trafficWorld.clear();
  trafficCars.length = 0;
  for (let index = 0; index < map.traffic; index += 1) {
    const car = createTrafficVehicle(index, playerVehicleId);
    car.position.set(car.userData.laneX, 0.02, -55 - index * 56 - (index % 3) * 19);
    trafficWorld.add(car);
    trafficCars.push(car);
  }
}

const archivePageTextureCache = new Map();

function getArchivePageTexture(map) {
  if (archivePageTextureCache.has(map.id)) return archivePageTextureCache.get(map.id);
  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = 512;
  pageCanvas.height = 704;
  const context = pageCanvas.getContext("2d");
  const accent = "#" + new THREE.Color(map.accent).getHexString();
  context.fillStyle = "#e8e1d0";
  context.fillRect(0, 0, 512, 704);
  context.strokeStyle = "#26313a";
  context.lineWidth = 12;
  context.strokeRect(22, 22, 468, 660);
  context.fillStyle = accent;
  context.fillRect(22, 22, 468, 22);
  context.fillStyle = "#1b252d";
  context.font = "700 28px Arial";
  context.fillText("THE DRAWN MOTION", 54, 92);
  context.font = "600 16px Arial";
  context.fillText("LOST ARCHIVE SKETCH", 56, 122);
  context.strokeStyle = "#30373b";
  context.lineWidth = 9;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(78, 421);
  context.bezierCurveTo(104, 330, 168, 278, 255, 270);
  context.bezierCurveTo(338, 268, 411, 323, 440, 414);
  context.lineTo(407, 443);
  context.lineTo(105, 443);
  context.closePath();
  context.stroke();
  context.beginPath();
  context.arc(151, 448, 48, 0, Math.PI * 2);
  context.arc(365, 448, 48, 0, Math.PI * 2);
  context.stroke();
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(172, 331);
  context.lineTo(224, 289);
  context.lineTo(321, 290);
  context.lineTo(354, 334);
  context.stroke();
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 11; column += 1) {
      context.fillStyle = (row + column) % 2 ? "#cbbf9c" : "#1f2a32";
      context.fillRect(56 + column * 36, 574 + row * 34, 30, 28);
    }
  }
  context.fillStyle = accent;
  context.fillRect(56, 652, 152, 10);
  const texture = new THREE.CanvasTexture(pageCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  archivePageTextureCache.set(map.id, texture);
  return texture;
}

function buildCollectibles(map) {
  collectibleWorld.clear();
  collectibleCards.length = 0;
  map.pages.forEach(function (distance, index) {
    const group = new THREE.Group();
    const glow = new THREE.PointLight(map.accent, 2.1, 10);
    glow.position.y = 1.45;
    const card = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.98, 0.026),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: getArchivePageTexture(map),
        roughness: 0.78,
        metalness: 0,
        clearcoat: 0.18,
        clearcoatRoughness: 0.72,
        emissive: map.accent,
        emissiveIntensity: 0.055,
      }),
    );
    card.position.y = 1.32;
    card.castShadow = true;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.018, 8, 48),
      new THREE.MeshBasicMaterial({ color: map.accent, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending }),
    );
    ring.position.y = 1.31;
    group.add(card, ring, glow);
    group.userData.distance = distance;
    group.userData.index = index;
    group.userData.collected = false;
    group.userData.laneX = LANE_X[map.pageLanes[index] + 1];
    group.position.x = group.userData.laneX;
    collectibleWorld.add(group);
    collectibleCards.push(group);
  });
}

function setRaceWeather(race, weather, label) {
  if (!race) return;
  race.weather = weather;
  screens.game.dataset.weather = weather;
  weatherBadge.textContent = weather === "clear" ? "CLEAR" : weather.toUpperCase();
  worldEventLabel.textContent = label || (weather === "clear" ? "CLEAR ROAD" : weather.toUpperCase() + " FRONT");
  worldEventPanel.classList.toggle("alert", weather !== "clear");
  worldEventPanel.classList.toggle("idle", weather === "clear" && !race.currentEvent);
}

function createEventMarkerMaterial(color, emissive) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: emissive || color,
    emissiveIntensity: 1.7,
    roughness: 0.38,
    metalness: 0.18,
  });
}

function buildRoadEvent(race, type) {
  eventWorld.clear();
  const group = new THREE.Group();
  group.position.z = -82;
  group.userData.eventType = type;
  group.userData.triggered = false;
  const dark = makeMaterial(0x151c22, 0.62, 0.36);
  const warning = createEventMarkerMaterial(0xff7a38, 0xff3217);
  const policeBlue = createEventMarkerMaterial(0x77dfff, 0x2baaff);
  const policeRed = createEventMarkerMaterial(0xff544d, 0xff1600);
  if (type === "roadwork") {
    race.closedLane = Math.floor(Math.random() * 3);
    for (let index = 0; index < 9; index += 1) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 12), warning);
      cone.position.set(LANE_X[race.closedLane] + (index % 2 ? 1.25 : -1.25), 0.35, index * -5.2);
      cone.castShadow = true;
      group.add(cone);
    }
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.05, 0.12), warning);
    sign.position.set(LANE_X[race.closedLane], 1.35, 3.5);
    group.add(sign);
  } else if (type === "police") {
    [-1, 1].forEach(function (side, index) {
      const unit = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.75, 4.5), dark);
      unit.position.set(side * 9.2, 0.55, index * -14);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.26), index ? policeBlue : policeRed);
      bar.position.set(side * 9.2, 1.1, index * -14);
      group.add(unit, bar);
    });
  } else if (type === "tunnel") {
    for (let index = 0; index < 8; index += 1) {
      const z = -index * 14;
      const top = new THREE.Mesh(new THREE.BoxGeometry(20.8, 0.75, 1.1), dark);
      top.position.set(0, 7.2, z);
      const left = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.5, 1.1), dark);
      const right = left.clone();
      left.position.set(-10, 3.55, z);
      right.position.set(10, 3.55, z);
      const light = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.08, 0.3), policeBlue);
      light.position.set(0, 6.7, z);
      group.add(top, left, right, light);
    }
  } else if (type === "bridge") {
    [-1, 1].forEach(function (side) {
      for (let index = 0; index < 5; index += 1) {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(0.85, 10.5, 1.2), dark);
        tower.position.set(side * 10.2, 5.1, -index * 28);
        const cable = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 28), policeBlue);
        cable.position.set(side * 9.8, 8.8, -index * 28 - 14);
        cable.rotation.x = side * 0.08;
        group.add(tower, cable);
      }
    });
  }
  eventWorld.add(group);
}

function beginDynamicEvent(race) {
  const physicalEvents = ["roadwork", "police", "tunnel", "bridge"];
  const weatherEvent = race.map.scenery === "city" ? "rain" : race.map.scenery === "canyon" ? "dust" : "fog";
  const pool = consoleSettings.weather ? physicalEvents.concat([weatherEvent, weatherEvent]) : physicalEvents;
  const type = pool[Math.floor(Math.random() * pool.length)];
  race.currentEvent = type;
  race.eventEndDistance = race.distance + (type === "rain" || type === "dust" || type === "fog" ? 520 : 410);
  race.nextWorldEventDistance = race.distance + 720 + Math.random() * 360;
  const labels = {
    rain: "RAIN SHOWER · LOW GRIP",
    dust: "DUST FRONT · LOW VISIBILITY",
    fog: "MOUNTAIN FOG · LOW VISIBILITY",
    roadwork: "ROAD WORK · LANE CLOSED",
    police: "POLICE CHECK · 110 KM/H",
    tunnel: "TUNNEL SECTOR · LIGHTS ON",
    bridge: "HERITAGE BRIDGE · CROSSWIND",
  };
  if (type === "rain" || type === "dust" || type === "fog") setRaceWeather(race, type, labels[type]);
  else {
    setRaceWeather(race, "clear", labels[type]);
    worldEventPanel.classList.add("alert");
    buildRoadEvent(race, type);
  }
  showToast(labels[type], type === "roadwork" || type === "police", "!");
  pulseGamepad(120, 0.34, 0.22);
}

function updateDynamicRoute(race, travel) {
  if (race.distance >= race.nextWorldEventDistance && !race.currentEvent) beginDynamicEvent(race);
  eventWorld.children.forEach(function (eventGroup) {
    eventGroup.position.z += travel;
    const eventType = eventGroup.userData.eventType;
    if (!eventGroup.userData.triggered && eventGroup.position.z > -18) {
      eventGroup.userData.triggered = true;
      if (eventType === "roadwork" && Math.abs(race.playerX - LANE_X[race.closedLane]) < 2.2) {
        race.speed *= 0.72;
        race.combo = 1;
        showToast("ROAD WORK PENALTY · CHANGE LANE", true, "-");
        pulseGamepad(170, 0.42, 0.5);
      }
      if (eventType === "police") {
        if (race.speed > 110) {
          race.score = Math.max(0, race.score - 900);
          race.combo = 1;
          showToast("SPEED CHECK · 900 POINT PENALTY", true, "-");
        } else {
          addScore(650, 0.2);
          showToast("CLEAN SPEED CHECK · +650", false, "✓");
        }
      }
    }
    if (eventGroup.position.z > 140) eventGroup.visible = false;
  });
  if (race.currentEvent && race.distance >= race.eventEndDistance) {
    race.currentEvent = null;
    race.closedLane = -1;
    eventWorld.clear();
    setRaceWeather(race, "clear", "CLEAR ROAD");
    worldEventPanel.classList.remove("alert");
  }
}

function takeCollectorPhoto() {
  const race = state.race;
  if (!race || !race.active || race.paused || race.finished) return;
  const candidates = trafficCars
    .filter(function (car) { return car.userData.collectionVehicleId && Math.abs(car.position.z - PLAYER_Z) < 58; })
    .sort(function (a, b) { return Math.abs(a.position.z - PLAYER_Z) - Math.abs(b.position.z - PLAYER_Z); });
  const target = candidates[0];
  if (!target) {
    showToast("NO ARCHIVE CAR IN FRAME", true, "P");
    return;
  }
  const photoId = target.userData.photoId;
  if (race.photos.has(photoId)) {
    showToast("PHOTO ALREADY ARCHIVED", true, "P");
    return;
  }
  race.photos.add(photoId);
  if (!driverProfile.photos.includes(target.userData.collectionVehicleId)) driverProfile.photos.push(target.userData.collectionVehicleId);
  if (!driverProfile.vehicles.includes(target.userData.collectionVehicleId)) driverProfile.vehicles.push(target.userData.collectionVehicleId);
  saveDriverProfile();
  addScore(1250, 0.45);
  race.visualPulse = 1;
  screens.game.classList.remove("photo-flash");
  void screens.game.offsetWidth;
  screens.game.classList.add("photo-flash");
  window.setTimeout(function () { screens.game.classList.remove("photo-flash"); }, 180);
  playTone(880, 0.14, "square", 0.036);
  pulseGamepad(70, 0.18, 0.52);
  showToast("COLLECTOR PHOTO " + Math.min(3, race.photos.size) + " / 3 · +1250", false, "P");
  updateHud();
}

function resizeRenderer() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const dprCap = consoleSettings.quality === "performance" ? 1.2 : consoleSettings.quality === "high" ? 1.8 : 2.5;
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", function () {
  resizeRenderer();
  resizeShowroom();
});

async function startRace() {
  initAudio();
  const vehicle = vehicles[state.vehicle];
  const map = maps[state.map];
  const timedLimit = state.mode === "contract"
    ? map.timeLimit
    : state.mode === "time_trial"
      ? Math.max(48, map.timeLimit - 8)
      : state.mode === "collector"
        ? map.timeLimit + 18
        : Infinity;
  state.race = {
    active: false,
    paused: false,
    finished: false,
    mode: state.mode,
    speed: 0,
    distance: 0,
    elapsed: 0,
    timeRemaining: timedLimit,
    playerX: 0,
    steer: 0,
    maxSpeed: 0,
    boost: 100,
    boostActive: false,
    boostWasActive: false,
    score: 0,
    combo: 1,
    comboTimer: 0,
    nearMisses: 0,
    overtakes: 0,
    highSpeedTimer: 0,
    highSpeedAwards: 0,
    lap: 1,
    nextCheckpointDistance: map.distance,
    cameraMode: 0,
    orbitCamera: false,
    orbitAngle: 0.42,
    orbitElevation: 0.28,
    orbitAutoRotate: true,
    orbitDragging: false,
    orbitPointerX: 0,
    orbitPointerY: 0,
    orbitLastTime: performance.now() / 1000,
    difficultyLevel: 1,
    difficultyStartDistance: 0,
    nextDifficultyDistance: 360,
    cleanRun: true,
    finishPending: false,
    impactShake: 0,
    visualPulse: 0,
    offRoad: false,
    pages: new Set(),
    photos: new Set(),
    firstClearReward: false,
    lastTime: performance.now(),
    vehicle,
    map,
    collisionCooldown: 0,
    weather: "clear",
    currentEvent: null,
    eventEndDistance: 0,
    nextWorldEventDistance: 520 + Math.random() * 180,
    closedLane: -1,
  };
  hud.vehicleImage.src = vehicle.image;
  hud.vehicle.textContent = vehicle.name;
  hud.vehicleClass.textContent = vehicle.className;
  hud.map.textContent = map.name;
  hud.cameraButton.textContent = "CAM 1";
  hud.orbitButton.textContent = "360° VIEW";
  hud.orbitButton.classList.remove("active");
  hud.cameraButton.disabled = false;
  const objectivePips = state.mode === "collector" ? 3 : modeDefinitions[state.mode].pages ? 4 : 0;
  hud.pages.innerHTML = Array.from({ length: objectivePips }, function (_, index) {
    return '<i class="page-pip" data-pip="' + index + '"></i>';
  }).join("");
  updateHud();
  showScreen("game");
  screens.game.dataset.route = map.id;
  setRaceWeather(state.race, "clear", "CLEAR ROAD");
  screens.game.classList.remove("boosting", "impact", "offroad", "orbiting");
  pausePanel.classList.remove("show");
  if (currentMapTheme !== map.id) buildRoad(map);
  eventWorld.clear();
  if (modeDefinitions[state.mode].pages) buildCollectibles(map);
  else {
    collectibleWorld.clear();
    collectibleCards.length = 0;
  }

  if (playerCar) scene.remove(playerCar);
  const playerVehiclePromise = createPlayerVehicle(vehicle);
  await prepareTrafficModelPrototypes();
  buildTraffic(map, vehicle.id);
  playerCar = await playerVehiclePromise;
  if (!state.race || state.race.vehicle.id !== vehicle.id || state.screen !== "game") return;
  playerCar.position.set(0, 0.02, PLAYER_Z);
  if (playerCar.userData.headlights) {
    const headlightPower = map.scenery === "city" ? 17 : map.scenery === "forest" ? 10 : 3;
    playerCar.userData.headlights.forEach(function (light) { light.intensity = headlightPower; });
  }
  scene.add(playerCar);
  resizeRenderer();
  cancelAnimationFrame(state.raf);
  state.race.lastTime = performance.now();
  state.raf = requestAnimationFrame(gameFrame);
  runCountdown();
}

function runCountdown() {
  let number = 3;
  const show = function (value) {
    countdown.textContent = value;
    countdown.classList.remove("show");
    void countdown.offsetWidth;
    countdown.classList.add("show");
  };
  show(number);
  const timer = setInterval(function () {
    if (!state.race || state.screen !== "game") {
      clearInterval(timer);
      return;
    }
    number -= 1;
    if (number > 0) show(number);
    else if (number === 0) show("GO");
    else {
      clearInterval(timer);
      countdown.classList.remove("show");
      state.race.active = true;
      state.race.lastTime = performance.now();
      showToast(
        state.race.mode === "contract"
          ? "CONTRACT LIVE · RECOVER 4 PAGES"
          : state.race.mode === "time_trial"
            ? "TIME TRIAL LIVE · CLEAN FINISH"
            : state.race.mode === "collector"
              ? "COLLECTOR LIVE · PHOTOGRAPH 3 CARS"
              : "ENDLESS SURVIVAL · STAY CLEAN",
        false,
        "GO",
      );
    }
  }, 760);
}

function cycleCameraMode() {
  const race = state.race;
  if (!race || race.finished) return;
  if (race.orbitCamera) setOrbitCamera(false, false);
  race.cameraMode = (race.cameraMode + 1) % 3;
  hud.cameraButton.textContent = "CAM " + (race.cameraMode + 1);
  const labels = ["CHASE CAMERA", "CLOSE CAMERA", "WIDE CAMERA"];
  showToast(labels[race.cameraMode], false, "◉");
}

function setOrbitCamera(enabled, announce) {
  const race = state.race;
  if (!race || race.finished) return;
  race.orbitCamera = enabled;
  race.orbitDragging = false;
  race.orbitAutoRotate = enabled;
  race.orbitLastTime = performance.now() / 1000;
  screens.game.classList.toggle("orbiting", enabled);
  hud.orbitButton.classList.toggle("active", enabled);
  hud.orbitButton.textContent = enabled ? "EXIT 360°" : "360° VIEW";
  hud.cameraButton.disabled = enabled;
  if (announce !== false) showToast(enabled ? "360° VEHICLE VIEW · DRAG TO ORBIT" : "CHASE CAMERA RESTORED", false, "360°");
}

function toggleOrbitCamera() {
  const race = state.race;
  if (!race || race.finished) return;
  setOrbitCamera(!race.orbitCamera, true);
}

canvas.addEventListener("pointerdown", function (event) {
  const race = state.race;
  if (!race || !race.orbitCamera) return;
  race.orbitDragging = true;
  race.orbitAutoRotate = false;
  race.orbitPointerX = event.clientX;
  race.orbitPointerY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", function (event) {
  const race = state.race;
  if (!race || !race.orbitCamera || !race.orbitDragging) return;
  race.orbitAngle += (event.clientX - race.orbitPointerX) * 0.012;
  race.orbitElevation = THREE.MathUtils.clamp(race.orbitElevation + (event.clientY - race.orbitPointerY) * 0.003, -0.08, 0.66);
  race.orbitPointerX = event.clientX;
  race.orbitPointerY = event.clientY;
});
["pointerup", "pointercancel", "lostpointercapture"].forEach(function (name) {
  canvas.addEventListener(name, function () {
    if (state.race) state.race.orbitDragging = false;
  });
});

function togglePause() {
  const race = state.race;
  if (!race || race.finished || !race.active) return;
  race.paused = !race.paused;
  pausePanel.classList.toggle("show", race.paused);
  race.lastTime = performance.now();
  updateAudio(race.speed, race.vehicle.maxSpeed, !race.paused, race.boostActive);
}

document.getElementById("pauseButton").addEventListener("click", togglePause);
hud.cameraButton.addEventListener("click", cycleCameraMode);
hud.orbitButton.addEventListener("click", toggleOrbitCamera);
document.getElementById("resumeButton").addEventListener("click", togglePause);
document.getElementById("quitButton").addEventListener("click", function () { quitRace("map"); });
document.getElementById("replayButton").addEventListener("click", startRace);
document.getElementById("newRouteButton").addEventListener("click", function () {
  updateBestLabels();
  showScreen("map");
});
document.addEventListener("visibilitychange", function () {
  if (document.hidden && state.screen === "game" && state.race && state.race.active && !state.race.paused) togglePause();
});

function quitRace(target) {
  if (state.race) state.race.active = false;
  cancelAnimationFrame(state.raf);
  updateAudio(0, 1, false);
  screens.game.classList.remove("boosting", "impact", "offroad", "orbiting");
  pausePanel.classList.remove("show");
  eventWorld.clear();
  screens.game.dataset.weather = "clear";
  showScreen(target);
}

function addScore(points, comboStep) {
  const race = state.race;
  if (!race) return;
  race.score += Math.round(points * race.combo);
  if (comboStep) race.combo = Math.min(5, race.combo + comboStep);
  race.comboTimer = 4.2;
}

function addDifficultyTraffic(race) {
  if (trafficCars.length >= race.map.traffic + 9) return;
  const index = trafficCars.length;
  const car = createTrafficVehicle(index, race.vehicle.id);
  const lane = Math.floor(Math.random() * 3);
  car.userData.lane = lane;
  car.userData.targetLane = lane;
  car.userData.laneX = LANE_X[lane];
  const pressure = Math.min(race.difficultyLevel, 14);
  car.userData.speed = 42 + Math.random() * (84 + pressure * 5);
  car.userData.cruiseSpeed = car.userData.speed;
  car.userData.changeTimer = 0.7 + Math.random() * 1.6;
  car.position.set(car.userData.laneX, 0.02, -310 - index * 32 - Math.random() * 110);
  trafficWorld.add(car);
  trafficCars.push(car);
}

function updateDifficulty() {
  const race = state.race;
  if (!race || !race.cleanRun || race.difficultyLevel >= 30 || race.distance < race.nextDifficultyDistance) return;
  race.difficultyLevel += 1;
  race.difficultyStartDistance = race.nextDifficultyDistance;
  race.nextDifficultyDistance += Math.max(260, 390 - race.difficultyLevel * 22);
  addDifficultyTraffic(race);
  addScore(350 * race.difficultyLevel, 0.2);
  playTone(390 + race.difficultyLevel * 75, 0.22, "square", 0.032);
  showToast("LEVEL " + race.difficultyLevel + " · TRAFFIC INTENSIFIED", false, "↑");
}

function updateCheckpoint() {
  const race = state.race;
  if (!race || race.distance < race.nextCheckpointDistance) return;
  if (race.mode === "contract") {
    finishRace(race.pages.size === 4 ? "complete" : "incomplete");
    return;
  }
  if (race.mode === "time_trial") {
    finishRace("complete");
    return;
  }
  if (race.mode === "collector") {
    finishRace(race.photos.size >= 3 ? "complete" : "photo-incomplete");
    return;
  }
  race.lap += 1;
  race.nextCheckpointDistance += race.map.distance;
  race.boost = Math.min(100, race.boost + 28);
  addScore(1200 + race.lap * 240, 0.35);
  addDifficultyTraffic(race);
  trafficCars.forEach(function (car) {
    car.userData.cruiseSpeed = Math.max(38, car.userData.cruiseSpeed - Math.min(7, 1.5 + race.lap * 0.35));
  });
  collectibleCards.forEach(function (card) {
    if (!card.userData.collected) card.userData.distance += race.map.distance;
  });
  playTone(510 + Math.min(8, race.lap) * 45, 0.28, "square", 0.04);
  showToast("LAP " + race.lap + " · SURVIVAL CONTINUES", false, "◆");
}

function triggerImpact(car) {
  const race = state.race;
  if (!race || race.finishPending || race.finished) return;
  race.finishPending = true;
  race.cleanRun = false;
  race.active = false;
  race.speed = 0;
  race.boostActive = false;
  race.combo = 1;
  race.comboTimer = 0;
  race.impactShake = 1;
  car.userData.cooldown = 1.2;
  car.userData.laneX += car.position.x <= race.playerX ? -1.2 : 1.2;
  screens.game.classList.add("impact");
  window.setTimeout(function () { screens.game.classList.remove("impact"); }, 180);
  if (navigator.vibrate) navigator.vibrate(90);
  pulseGamepad(260, 1, 0.82);
  playTone(88, 0.22, "sawtooth", 0.055);
  showToast("COLLISION · RUN ENDED", true, "!");
  window.setTimeout(function () {
    if (state.race === race) finishRace("crash");
  }, 420);
}

function recycleTraffic(car, index) {
  const difficulty = state.race ? Math.min(state.race.difficultyLevel, 14) : 1;
  const spacing = Math.max(25, 39 - difficulty * 2.2);
  car.position.z = -340 - index * spacing - Math.random() * (170 / Math.sqrt(difficulty));
  car.userData.lane = Math.floor(Math.random() * 3);
  car.userData.targetLane = car.userData.lane;
  car.userData.laneX = LANE_X[car.userData.lane];
  car.position.x = car.userData.laneX;
  car.userData.speed = 46 + Math.random() * (88 + difficulty * 6);
  car.userData.cruiseSpeed = car.userData.speed;
  car.userData.changeTimer = (1 + Math.random() * 3.6) / (1 + (difficulty - 1) * 0.16);
  car.userData.cooldown = 0;
  car.userData.photoCycle = (car.userData.photoCycle || 0) + 1;
  car.userData.photoId = (car.userData.collectionVehicleId || "traffic") + "-" + index + "-" + car.userData.photoCycle;
}

function updateWorld(dt, time) {
  const race = state.race;
  const travel = race.speed * dt * WORLD_SCALE;
  updateDynamicRoute(race, travel);
  updateAtmosphere(dt, time, travel);
  animatedLandmarkMaterials.forEach(function (material) {
    const pulse = 0.82 + Math.sin(time * 2.5 + material.userData.phase) * 0.18;
    material.emissiveIntensity = material.userData.baseIntensity * pulse + race.visualPulse * 2.2;
  });
  routeLandmarks.forEach(function (landmark) {
    landmark.children.forEach(function (child) {
      if (child.userData.spin) child.rotation.z = time * 0.42 + landmark.userData.seed;
    });
  });
  roadSegments.forEach(function (segment) {
    const previousSegmentZ = segment.position.z;
    segment.position.z += travel;
    segment.children.forEach(function (child) {
      if (!child.userData || !child.userData.isSceneryCluster) return;
      child.children.forEach(function (sceneryItem) {
        if (!sceneryItem.userData || !sceneryItem.userData.isDistantFormation) return;
        const formationWorldZ = segment.position.z + child.position.z + sceneryItem.position.z;
        sceneryItem.visible = formationWorldZ < -72;
      });
    });
    const landmark = segment.userData.landmark;
    if (landmark) {
      const previousLandmarkZ = previousSegmentZ + landmark.position.z;
      const landmarkZ = segment.position.z + landmark.position.z;
      if (previousLandmarkZ <= -48 && landmarkZ > -48 && landmark.userData.lastAnnouncedCycle !== segment.userData.cycle) {
        landmark.userData.lastAnnouncedCycle = segment.userData.cycle;
        triggerRouteMoment(landmark);
      }
    }
    if (segment.position.z > 37) {
      segment.position.z -= SEGMENT_LENGTH * SEGMENT_COUNT;
      segment.userData.cycle = (segment.userData.cycle || 0) + 1;
      segment.children.forEach(function (child) {
        if (!child.userData || (!child.userData.isMotionProp && !child.userData.isSceneryCluster)) return;
        const variation = ((child.userData.seed * 7 + segment.userData.cycle * 11) % 7) - 3;
        child.position.z = (child.userData.baseZ || 0) + variation * (child.userData.isMotionProp ? 1.35 : 0.72);
        child.position.x = child.userData.side * variation * (child.userData.isMotionProp ? 0.22 : 0.12);
        child.rotation.y = variation * (child.userData.isMotionProp ? 0.018 : 0.006);
      });
    }
    segment.position.x = 0;
    segment.rotation.y = 0;
  });

  trafficCars.forEach(function (car, index) {
    if (race.finishPending || race.finished) return;
    let leader = null;
    let leaderGap = Infinity;
    trafficCars.forEach(function (other) {
      if (other === car || other.userData.targetLane !== car.userData.targetLane || other.position.z >= car.position.z) return;
      const gap = car.position.z - other.position.z;
      if (gap < leaderGap) {
        leaderGap = gap;
        leader = other;
      }
    });
    const braking = Boolean(leader && leaderGap < (car.userData.isTrafficTruck ? 44 : 36));
    const targetTrafficSpeed = braking
      ? Math.max(32, Math.min(car.userData.cruiseSpeed, leader.userData.speed - 4 + leaderGap * 0.22))
      : car.userData.cruiseSpeed;
    car.userData.speed = THREE.MathUtils.lerp(
      car.userData.speed,
      targetTrafficSpeed,
      1 - Math.pow(braking ? 0.012 : 0.18, dt),
    );
    if (car.userData.tailMaterial) car.userData.tailMaterial.emissiveIntensity = braking ? 5.2 : 1.8;
    const previousZ = car.position.z;
    const relative = (race.speed - car.userData.speed) * dt * WORLD_SCALE;
    car.position.z += relative;
    car.userData.cooldown = Math.max(0, car.userData.cooldown - dt);
    car.userData.changeTimer -= dt;
    if (car.position.z > 24 || car.position.z < -760) recycleTraffic(car, index);
    if ((car.userData.changeTimer <= 0 || (braking && leaderGap < 26)) && car.position.z < -42) {
      const directions = Math.random() > 0.5 ? [-1, 1] : [1, -1];
      const openLane = directions
        .map(function (direction) { return car.userData.lane + direction; })
        .find(function (lane) { return lane >= 0 && lane <= 2 && trafficLaneIsClear(car, lane); });
      if (openLane !== undefined) {
        car.userData.targetLane = openLane;
        car.userData.lane = openLane;
      }
      const lanePressure = Math.min(race.difficultyLevel, 14);
      car.userData.changeTimer = (3.5 + Math.random() * 5.5) / (1 + (lanePressure - 1) * 0.24);
    }
    const lanePressure = Math.min(race.difficultyLevel, 14);
    const laneChangeGrip = Math.max(0.09, 0.18 - (lanePressure - 1) * 0.015);
    const laneTurn = LANE_X[car.userData.targetLane] - car.userData.laneX;
    car.userData.laneX = THREE.MathUtils.lerp(car.userData.laneX, LANE_X[car.userData.targetLane], 1 - Math.pow(laneChangeGrip, dt));
    car.position.x = car.userData.laneX;
    car.rotation.y = THREE.MathUtils.lerp(car.rotation.y, -laneTurn * 0.018, 1 - Math.pow(0.02, dt));
    animateVehicleWheels(car, car.userData.speed * dt / 36, laneTurn * 0.08);
    const lateralDistance = Math.abs(car.position.x - race.playerX);
    if (
      race.collisionCooldown <= 0 &&
      car.userData.cooldown <= 0 &&
      Math.abs(car.position.z - PLAYER_Z) < 3.2 &&
      lateralDistance < 2
    ) {
      triggerImpact(car);
    } else if (previousZ <= PLAYER_Z && car.position.z > PLAYER_Z && lateralDistance >= 2 && lateralDistance < 3.65) {
      race.nearMisses += 1;
      race.overtakes += 1;
      race.boost = Math.min(100, race.boost + 14);
      addScore(420, 0.35);
      playTone(620 + Math.min(4, race.combo) * 80, 0.11, "square", 0.025);
      pulseGamepad(65, 0.12, 0.42);
      showToast("NEAR MISS · BOOST +14", false, "×");
    } else if (previousZ <= PLAYER_Z && car.position.z > PLAYER_Z && lateralDistance >= 3.65) {
      race.overtakes += 1;
      addScore(140, 0.04);
    }
  });

  collectibleCards.forEach(function (card) {
    if (card.userData.collected) return;
    const delta = card.userData.distance - race.distance;
    card.position.z = PLAYER_Z - delta * WORLD_SCALE;
    card.position.x = card.userData.laneX;
    card.position.y = Math.sin(time * 1.8 + card.userData.index * 1.7) * 0.1;
    card.rotation.y = time * 0.72 + card.userData.index;
    card.rotation.z = Math.sin(time * 0.9 + card.userData.index) * 0.035;
    card.visible = delta > -35 && delta < 520;
    if (delta < 24 && delta > -12 && Math.abs(card.position.x - race.playerX) < 1.8) {
      collectPage(card.userData.index);
      card.userData.collected = true;
      card.visible = false;
    }
  });
}

function updateRace(dt, time) {
  const race = state.race;
  const input = readControls();
  const vehicle = race.vehicle;
  const initialSpeedRatio = THREE.MathUtils.clamp(race.speed / vehicle.maxSpeed, 0, 1.2);
  race.boostActive = input.boost > 0 && input.gas > 0 && race.boost > 0.5 && race.speed > 28;
  if (race.boostActive) {
    race.boost = Math.max(0, race.boost - 31 * dt);
    race.speed += 37 * dt;
  } else {
    race.boost = Math.min(100, race.boost + (input.gas > 0 ? 7 : 12) * dt);
  }
  if (race.boostActive && !race.boostWasActive) {
    playTone(210, 0.17, "sawtooth", 0.025);
    pulseGamepad(90, 0.22, 0.48);
  }
  race.boostWasActive = race.boostActive;

  if (input.gas > 0) race.speed += vehicle.acceleration * input.gas * (1 - Math.min(0.62, initialSpeedRatio * 0.55)) * dt;
  else race.speed -= (8 + initialSpeedRatio * 8) * dt;
  if (input.brake > 0) race.speed -= vehicle.brake * input.brake * dt;

  race.speed -= initialSpeedRatio * initialSpeedRatio * 3.2 * dt;
  const speedRatio = THREE.MathUtils.clamp(race.speed / vehicle.maxSpeed, 0, 1.2);
  const weatherGrip = race.weather === "rain" ? 0.78 : race.weather === "dust" ? 0.88 : race.weather === "fog" ? 0.93 : 1;
  race.steer = THREE.MathUtils.lerp(race.steer, input.steer, 1 - Math.pow(0.002, dt));
  race.playerX += input.steer * vehicle.handling * weatherGrip * (4.25 + Math.min(1, speedRatio) * 2.2) * dt;
  race.playerX *= Math.pow(0.9984, dt * 60);
  race.offRoad = Math.abs(race.playerX) > 7.25;
  if (race.offRoad) race.speed -= (54 + race.speed * 0.14) * dt;
  race.playerX = THREE.MathUtils.clamp(race.playerX, -9, 9);
  const dynamicTopSpeed = vehicle.maxSpeed * (race.boostActive ? 1.14 : 1);
  race.speed = THREE.MathUtils.clamp(race.speed, 0, dynamicTopSpeed);
  race.maxSpeed = Math.max(race.maxSpeed, race.speed);
  race.distance += race.speed * dt * 0.36;
  race.elapsed += dt;
  if (modeDefinitions[race.mode].timed) {
    race.timeRemaining = Math.max(0, race.timeRemaining - dt);
    if (race.timeRemaining <= 0) {
      finishRace("timeout");
      updateHud();
      return;
    }
  }
  race.score += race.speed * dt * 0.2 * race.combo;
  if (race.speed > vehicle.maxSpeed * 0.82) {
    race.highSpeedTimer += dt;
    const earnedAwards = Math.floor(race.highSpeedTimer / 4);
    if (earnedAwards > race.highSpeedAwards) {
      race.highSpeedAwards = earnedAwards;
      addScore(520, 0.2);
      showToast("HIGH SPEED FLOW · +520", false, "↑");
    }
  } else {
    race.highSpeedTimer = Math.max(0, race.highSpeedTimer - dt * 0.55);
  }
  updateDifficulty();
  updateCheckpoint();
  if (race.finished) {
    updateHud();
    return;
  }
  race.comboTimer = Math.max(0, race.comboTimer - dt);
  if (race.comboTimer <= 0) race.combo = THREE.MathUtils.lerp(race.combo, 1, 1 - Math.pow(0.05, dt));
  race.collisionCooldown = Math.max(0, race.collisionCooldown - dt);
  race.impactShake = Math.max(0, race.impactShake - dt * 3.8);
  race.visualPulse = Math.max(0, race.visualPulse - dt * 0.9);

  screens.game.classList.toggle("boosting", race.boostActive);
  screens.game.classList.toggle("offroad", race.offRoad);
  driveEffects.style.setProperty("--speed-intensity", Math.max(0, Math.min(1, (speedRatio - 0.46) / 0.54)).toFixed(3));
  driveEffects.style.setProperty("--cinema-intensity", Math.max(speedRatio * 0.72, race.visualPulse).toFixed(3));

  if (playerCar) {
    playerCar.position.x = THREE.MathUtils.lerp(playerCar.position.x, race.playerX, 1 - Math.pow(0.0003, dt));
    // Keep the body planted on asphalt. The previous high-frequency sine wave
    // moved the entire GLB up and down every frame, which read as model jitter
    // instead of suspension movement. A small, smoothed response now appears
    // only after the car actually leaves the paved road.
    const offRoadBodyMotion = race.offRoad ? Math.sin(time * 34) * 0.026 : 0;
    const bodyTargetY = 0.02 + offRoadBodyMotion;
    playerCar.position.y = THREE.MathUtils.lerp(playerCar.position.y, bodyTargetY, 1 - Math.pow(0.0008, dt));
    playerCar.rotation.y = THREE.MathUtils.lerp(
      playerCar.rotation.y,
      vehicle.viewYaw - race.steer * speedRatio * 0.045,
      1 - Math.pow(0.001, dt),
    );
    playerCar.rotation.z = THREE.MathUtils.lerp(playerCar.rotation.z, -race.steer * speedRatio * 0.008, 1 - Math.pow(0.001, dt));
    playerCar.rotation.x = THREE.MathUtils.lerp(
      playerCar.rotation.x,
      input.brake * speedRatio * 0.014 - input.gas * 0.004,
      1 - Math.pow(0.004, dt),
    );
    animateVehicleWheels(playerCar, race.speed * dt / Math.max(14, vehicle.wheelRadius * 44), race.steer);
    if (playerCar.userData.playerTailLights) {
      const tailIntensity = input.brake > 0 ? 1.45 : race.boostActive ? 0.5 : 0.3;
      playerCar.userData.playerTailLights.forEach(function (light) {
        light.intensity = THREE.MathUtils.lerp(light.intensity, tailIntensity, 1 - Math.pow(0.0004, dt));
      });
    }
  }

  updateWorld(dt, time);
  if (race.finishPending) {
    updateAudio(0, vehicle.maxSpeed, false);
    updateHud();
    return;
  }
  updateAudio(race.speed, vehicle.maxSpeed, true, race.boostActive);
  updateHud();
}

function showToast(message, danger, badge) {
  collectToast.innerHTML = '<span>' + (badge || (danger ? "!" : "+1")) + "</span> " + message;
  collectToast.style.background = danger ? "#ff4c28" : "";
  collectToast.classList.remove("show");
  void collectToast.offsetWidth;
  collectToast.classList.add("show");
  window.setTimeout(function () {
    collectToast.classList.remove("show");
    collectToast.style.background = "";
  }, 1200);
}

function collectPage(index) {
  const race = state.race;
  if (race.pages.has(index)) return;
  race.pages.add(index);
  const pageKey = race.map.id + "-" + index;
  if (!driverProfile.pages.includes(pageKey)) driverProfile.pages.push(pageKey);
  if (!driverProfile.vehicles.includes(race.vehicle.id)) driverProfile.vehicles.push(race.vehicle.id);
  saveDriverProfile();
  const pip = hud.pages.querySelector('[data-pip="' + index + '"]');
  if (pip) pip.classList.add("on");
  addScore(900, 0.5);
  playTone(760 + index * 110, 0.22, "sine", 0.045);
  pulseGamepad(105, 0.26, 0.64);
  showToast("LOST SKETCH · +" + Math.round(900 * race.combo), false, "+");
}

function updateHud() {
  const race = state.race;
  if (!race) return;
  const timedRun = modeDefinitions[race.mode].timed;
  const lapDistance = race.distance % race.map.distance;
  const routeDistance = timedRun ? Math.min(race.distance, race.map.distance) : lapDistance;
  const progress = Math.min(100, routeDistance / race.map.distance * 100);
  hud.progress.style.width = progress + "%";
  hud.map.textContent = race.map.name + (timedRun ? " · " + modeDefinitions[race.mode].label : " · LAP " + race.lap);
  hud.distance.textContent = timedRun
    ? (race.distance / 1000).toFixed(1) + " KM · FINISH " + Math.max(0, (race.map.distance - race.distance) / 1000).toFixed(1) + " KM"
    : (race.distance / 1000).toFixed(1) + " KM · NEXT LAP " + Math.max(0, (race.nextCheckpointDistance - race.distance) / 1000).toFixed(1) + " KM";
  hud.time.textContent = formatTime(timedRun ? race.timeRemaining : race.elapsed);
  hud.time.parentElement.classList.toggle("critical", timedRun && race.timeRemaining <= 15);
  if (race.mode === "contract") {
    hud.missionKicker.textContent = "ARCHIVE CONTRACT";
    hud.missionObjective.textContent = "RECOVER 4 PAGES · REACH FINISH";
    hud.missionStatus.textContent = "TIME " + formatTime(race.timeRemaining) + " · FINISH REQUIRED";
    hud.pageCounter.textContent = race.pages.size + " / 4";
  } else if (race.mode === "time_trial") {
    hud.missionKicker.textContent = "TIME TRIAL";
    hud.missionObjective.textContent = "REACH FINISH · NO COLLISIONS";
    hud.missionStatus.textContent = "TIME " + formatTime(race.timeRemaining) + " · " + race.overtakes + " OVERTAKES";
    hud.pageCounter.textContent = "CLEAN";
  } else if (race.mode === "collector") {
    hud.missionKicker.textContent = "COLLECTOR CHALLENGE";
    hud.missionObjective.textContent = "PHOTOGRAPH 3 ARCHIVE CARS";
    hud.missionStatus.textContent = "PRESS P · TIME " + formatTime(race.timeRemaining);
    hud.pageCounter.textContent = race.photos.size + " / 3";
    hud.pages.querySelectorAll(".page-pip").forEach(function (pip, index) { pip.classList.toggle("on", index < race.photos.size); });
  } else {
    hud.missionKicker.textContent = "SURVIVAL OBJECTIVE";
    hud.missionObjective.textContent = "STAY CLEAN · BUILD THE ARCHIVE";
    hud.missionStatus.textContent = race.nearMisses + " NEAR MISSES · LEVEL " + race.difficultyLevel;
    hud.pageCounter.textContent = race.pages.size + " / 4";
  }
  hud.speed.textContent = Math.round(race.speed).toString().padStart(3, "0");
  hud.telemetrySpeed.textContent = Math.round(race.speed).toString().padStart(3, "0");
  hud.telemetryScore.textContent = Math.round(race.score).toString().padStart(6, "0");
  hud.telemetryMultiplier.textContent = "×" + race.combo.toFixed(1);
  hud.telemetryDistance.textContent = (race.distance / 1000).toFixed(2);
  hud.speedBar.style.width = Math.min(100, race.speed / race.vehicle.maxSpeed * 100) + "%";
  hud.gear.textContent = race.speed < 3 ? "N" : Math.min(6, Math.max(1, Math.ceil(race.speed / 38))).toString();
  hud.score.textContent = Math.round(race.score).toString().padStart(6, "0");
  hud.combo.textContent = "×" + race.combo.toFixed(1);
  hud.combo.classList.toggle("hot", race.combo >= 2);
  hud.difficulty.textContent = "LEVEL " + race.difficultyLevel;
  const difficultySpan = Math.max(1, race.nextDifficultyDistance - race.difficultyStartDistance);
  const difficultyProgress = race.difficultyLevel >= 30
    ? 100
    : THREE.MathUtils.clamp((race.distance - race.difficultyStartDistance) / difficultySpan * 100, 0, 100);
  hud.difficultyProgress.style.width = difficultyProgress.toFixed(1) + "%";
  hud.boost.style.width = race.boost.toFixed(1) + "%";
  hud.boostLabel.textContent = Math.round(race.boost).toString().padStart(2, "0");
  updateTrafficRadar();
}

function finishRace(reason) {
  const race = state.race;
  if (!race || race.finished) return;
  const crashed = reason === "crash";
  const success = reason === "complete";
  const timedRun = modeDefinitions[race.mode].timed;
  race.finished = true;
  race.finishPending = false;
  race.active = false;
  race.boostActive = false;
  updateAudio(0, race.vehicle.maxSpeed, false);
  screens.game.classList.remove("boosting", "offroad");
  const pages = race.pages.size;
  let newRecord = false;
  let firstClear = false;
  if (timedRun && success) {
    const bestKey = "tdm-" + race.mode + "-best-" + race.map.id;
    const previousBest = Number(localStorage.getItem(bestKey));
    newRecord = !previousBest || race.elapsed < previousBest;
    if (newRecord) localStorage.setItem(bestKey, race.elapsed.toFixed(2));
    const clearKey = "tdm-" + race.mode + "-clear-" + race.map.id;
    firstClear = !localStorage.getItem(clearKey);
    if (firstClear) {
      localStorage.setItem(clearKey, "1");
      driverProfile.tokens = Number(driverProfile.tokens || 0) + 1;
      race.firstClearReward = true;
    }
  } else if (!timedRun) {
    const bestKey = "tdm-survival-best-" + race.map.id;
    const previousBest = Number(localStorage.getItem(bestKey));
    newRecord = !previousBest || race.distance > previousBest;
    if (newRecord) localStorage.setItem(bestKey, race.distance.toFixed(1));
  }
  const failedTimedRun = timedRun && !success;
  const grade = success
    ? race.timeRemaining > 18 && race.cleanRun ? "S" : "A"
    : crashed
      ? "X"
      : failedTimedRun
        ? "F"
        : race.nearMisses >= 8 || pages === 4 ? "A" : race.nearMisses >= 4 || pages >= 2 ? "B" : "C";
  const starsEarned = success ? (grade === "S" ? 3 : 2) : crashed && race.distance < 300 ? 0 : 1;
  const xpEarned = Math.max(120, Math.round(
    (success ? 850 : 180) + race.score * 0.035 + pages * 180 + race.photos.size * 260 + race.nearMisses * 55 + race.distance * 0.035,
  ));
  const medal = grade === "S" ? "PLATINUM" : grade === "A" ? "GOLD" : grade === "B" ? "SILVER" : grade === "C" ? "BRONZE" : "NO MEDAL";
  driverProfile.xp = Number(driverProfile.xp || 0) + xpEarned;
  driverProfile.stars = Number(driverProfile.stars || 0) + starsEarned;
  driverProfile.totalDistance = Number(driverProfile.totalDistance || 0) + race.distance;
  driverProfile.totalNearMisses = Number(driverProfile.totalNearMisses || 0) + race.nearMisses;
  const medalKey = race.mode + "-" + race.map.id;
  driverProfile.medals[medalKey] = Math.max(Number(driverProfile.medals[medalKey] || 0), starsEarned);
  saveDriverProfile();
  const resultKicker = document.getElementById("resultKicker");
  const resultTitle = document.getElementById("resultTitle");
  if (success) {
    resultKicker.textContent = modeDefinitions[race.mode].label + " · COMPLETE";
    resultTitle.innerHTML = "ROUTE SECURED.<br />ARCHIVE UPDATED.";
  } else if (reason === "timeout") {
    resultKicker.textContent = modeDefinitions[race.mode].label + " · TIME EXPIRED";
    resultTitle.innerHTML = "TIME IS OUT.<br />TRY AGAIN.";
  } else if (reason === "incomplete") {
    resultKicker.textContent = "CONTRACT FAILED · PAGES MISSING";
    resultTitle.innerHTML = "ARCHIVE<br />INCOMPLETE.";
  } else if (reason === "photo-incomplete") {
    resultKicker.textContent = "COLLECTOR CHALLENGE · PHOTOS MISSING";
    resultTitle.innerHTML = "COLLECTION<br />INCOMPLETE.";
  } else {
    resultKicker.textContent = modeDefinitions[race.mode].label + " · COLLISION";
    resultTitle.innerHTML = "ONE IMPACT.<br />RUN ENDED.";
  }
  document.getElementById("resultImage").src = race.vehicle.resultImage;
  const resultGrade = document.getElementById("resultGrade");
  resultGrade.textContent = grade;
  resultGrade.classList.toggle("crash", crashed || failedTimedRun);
  document.getElementById("resultTime").textContent = formatTime(race.elapsed);
  document.getElementById("resultDistance").textContent = (race.distance / 1000).toFixed(1) + " KM";
  document.getElementById("resultSpeed").textContent = Math.round(race.maxSpeed) + " KM/H";
  document.getElementById("resultScore").textContent = Math.round(race.score).toString().padStart(6, "0");
  document.getElementById("resultMedal").textContent = medal;
  document.getElementById("resultXp").textContent = "+" + xpEarned;
  document.getElementById("resultStars").textContent = starsEarned ? "★".repeat(starsEarned) + "☆".repeat(3 - starsEarned) : "☆☆☆";
  if (race.mode === "contract") {
    document.getElementById("resultMessage").textContent = success
      ? (firstClear ? "ARCHIVE TOKEN EARNED · " : "CONTRACT REPLAYED · ")
        + (newRecord ? "NEW BEST TIME · " : "") + "All four lost sketches recovered and the route was secured."
      : (reason === "timeout" ? "The contract clock expired. " : reason === "incomplete" ? "The finish was reached without every page. " : "The vehicle sustained an impact. ")
        + (4 - pages) + " sketch pages remain unarchived.";
  } else if (race.mode === "time_trial") {
    document.getElementById("resultMessage").textContent = success
      ? (newRecord ? "NEW ROUTE RECORD · " : "CLEAN FINISH · ") + race.overtakes + " controlled overtakes completed without contact."
      : "The precision run ended before the finish. Build speed smoothly and protect the clean line.";
  } else if (race.mode === "collector") {
    document.getElementById("resultMessage").textContent = success
      ? (firstClear ? "ARCHIVE TOKEN EARNED · " : "COLLECTION SECURED · ") + "Three moving archive cars were photographed and catalogued."
      : race.photos.size + " of 3 collector photographs secured. Bring an archive car inside the frame and press P.";
  } else {
    document.getElementById("resultMessage").textContent = (newRecord ? "NEW DISTANCE RECORD · " : "")
      + "Lap " + race.lap + ", level " + race.difficultyLevel + " and " + (race.distance / 1000).toFixed(1)
      + " kilometres. " + (pages === 4 ? "All lost sketches recovered." : (4 - pages) + " sketch pages remain on the road.");
  }
  pulseGamepad(success ? 220 : 130, success ? 0.55 : 0.32, success ? 0.7 : 0.38);
  updateBestLabels();
  window.setTimeout(function () { showScreen("result"); }, 500);
}

function renderScene(time) {
  const race = state.race;
  if (!race) return;
  if (activeSkyMaterial) activeSkyMaterial.uniforms.time.value = time;
  const speedRatio = THREE.MathUtils.clamp(race.speed / race.vehicle.maxSpeed, 0, 1.2);
  const scenery = race.map.scenery;
  const baseExposure = scenery === "city" ? 1.12 : scenery === "canyon" ? 1.06 : 1.1;
  const weatherExposure = race.weather === "clear" ? 0 : race.weather === "rain" ? -0.14 : race.weather === "dust" ? -0.08 : -0.19;
  const daylightPulse = scenery === "city" ? 0 : Math.sin(race.elapsed * 0.018 + (scenery === "forest" ? -0.6 : 0.3)) * 0.045;
  renderer.toneMappingExposure = baseExposure + weatherExposure + daylightPulse + speedRatio * 0.035 + race.visualPulse * 0.09 + Math.sin(time * 0.22) * 0.012;
  if (scene.fog && scene.fog.isFogExp2) {
    const weatherFog = race.weather === "rain" ? 1.45 : race.weather === "dust" ? 1.72 : race.weather === "fog" ? 2.05 : 1;
    scene.fog.density = race.map.fogDensity * weatherFog * (1 - Math.min(0.12, speedRatio * 0.09) + Math.sin(time * 0.16) * 0.015);
  }
  sun.intensity = (scenery === "city" ? 1.35 : 3.05 + daylightPulse * 7) * (race.weather === "clear" ? 1 : 0.68);
  hemisphere.intensity = (scenery === "city" ? 2.15 : 2.25 + daylightPulse * 2.5) * (race.weather === "fog" ? 0.78 : 1);
  roadFill.intensity = (scenery === "city" ? 1.55 : 0.95) + race.visualPulse * 0.65 + Math.sin(time * 0.7) * 0.04;
  vehicleRim.intensity = (scenery === "city" ? 1.45 : 1.05) + race.visualPulse * 0.8;
  if (race.orbitCamera) {
    const orbitDt = Math.min(0.05, Math.max(0, time - race.orbitLastTime));
    race.orbitLastTime = time;
    if (race.orbitAutoRotate && !race.orbitDragging) race.orbitAngle += orbitDt * 0.52;
    const orbitRadius = (race.vehicle.truck ? 10.2 : 8.7) + (race.vehicle.cameraDistanceBias || 0) * 0.35;
    const orbitHeight = 1.25 + race.orbitElevation * 4.5 + speedRatio * 0.08;
    const targetX = race.playerX;
    camera.position.set(
      targetX + Math.sin(race.orbitAngle) * orbitRadius,
      orbitHeight,
      PLAYER_Z + Math.cos(race.orbitAngle) * orbitRadius,
    );
    camera.fov = THREE.MathUtils.lerp(camera.fov, 52, 0.12);
    camera.updateProjectionMatrix();
    camera.lookAt(targetX, race.vehicle.truck ? 1.0 : 0.72, PLAYER_Z);
    renderer.render(scene, camera);
    return;
  }
  const cameraModes = [
    { follow: 0.78, y: 2.55, z: 10.15, fov: 58, look: 0.38, lookY: 0.9, lookZ: -14.5 },
    { follow: 0.9, y: 1.82, z: 7.15, fov: 62, look: 0.5, lookY: 0.98, lookZ: -17.5 },
    { follow: 0.6, y: 3.85, z: 15.6, fov: 64, look: 0.28, lookY: 0.72, lookZ: -10.5 },
  ];
  const view = cameraModes[race.cameraMode] || cameraModes[0];
  const targetCameraX = race.playerX * view.follow;
  const shake = consoleSettings.shake ? race.impactShake : 0;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCameraX, 0.075) + Math.sin(time * 71) * shake * 0.16;
  // Speed is communicated through FOV and roadside parallax; the chase camera
  // stays stable on asphalt so the vehicle silhouette remains sharp.
  const cameraRumble = consoleSettings.shake && race.offRoad ? Math.sin(time * 36) * (0.012 + speedRatio * 0.012) : 0;
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, view.y + (race.vehicle.cameraHeightBias || 0) + speedRatio * 0.24, 0.075) + cameraRumble + Math.cos(time * 63) * shake * 0.1;
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, view.z + (race.vehicle.cameraDistanceBias || 0) - speedRatio * 0.58 - (race.boostActive ? 0.32 : 0), 0.075);
  const targetFov = view.fov + speedRatio * 6.5 + (race.boostActive ? 4.5 : 0);
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.07);
  camera.updateProjectionMatrix();
  camera.lookAt(race.playerX * view.look, view.lookY, view.lookZ - speedRatio * 3.6);
  camera.rotation.z -= race.steer * speedRatio * 0.002;
  renderer.render(scene, camera);
}

function gameFrame(timeMs) {
  const race = state.race;
  if (!race || state.screen !== "game") return;
  const dt = Math.min(0.034, Math.max(0, (timeMs - race.lastTime) / 1000));
  race.lastTime = timeMs;
  if (race.active && !race.paused && !race.finished) updateRace(dt, timeMs / 1000);
  else readControls();
  renderScene(timeMs / 1000);
  state.raf = requestAnimationFrame(gameFrame);
}

updateBestLabels();
updateGamepadStatus(false);
syncSettingsUi();
applyGraphicsQuality();
chooseVehicle(state.vehicle);
chooseMap(state.map);
