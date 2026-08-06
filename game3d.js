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
    color: 0xe7e5db,
    modelRotation: -0.55,
    viewYaw: 0,
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
    targetLength: 4.7,
    targetWidth: 1.88,
    targetHeight: 1.42,
    wheelBase: 1.38,
    wheelRadius: 0.42,
    color: 0xa66f53,
    modelRotation: -0.55,
    viewYaw: 0,
    truck: false,
    tripoModel: true,
  },
};

const maps = {
  city: {
    id: "city",
    name: "NEON CITY CIRCUIT",
    distance: 2400,
    timeLimit: 64,
    pages: [440, 970, 1510, 2070],
    pageLanes: [-1, 1, 0, -1],
    sky: 0x060b19,
    fog: 0x101527,
    fogDensity: 0.012,
    road: 0x242a34,
    shoulder: 0x171b24,
    line: 0xdce6f5,
    accent: 0xff4c28,
    traffic: 11,
    scenery: "city",
    curveAmplitude: 4.2,
    curveFrequency: 0.0042,
    curvePhase: 0.4,
  },
  canyon: {
    id: "canyon",
    name: "RED ROCK EXPEDITION",
    distance: 2800,
    timeLimit: 70,
    pages: [510, 1120, 1800, 2470],
    pageLanes: [1, -1, 0, 1],
    sky: 0xd96a38,
    fog: 0x9b4c2d,
    fogDensity: 0.009,
    road: 0x332d2b,
    shoulder: 0x7d3826,
    line: 0xffe2a6,
    accent: 0xf2c451,
    traffic: 7,
    scenery: "canyon",
    curveAmplitude: 6.8,
    curveFrequency: 0.0036,
    curvePhase: 1.7,
  },
  forest: {
    id: "forest",
    name: "ALPINE INK RUN",
    distance: 2600,
    timeLimit: 72,
    pages: [390, 1050, 1720, 2310],
    pageLanes: [0, 1, -1, 0],
    sky: 0x91ada8,
    fog: 0x6d8278,
    fogDensity: 0.013,
    road: 0x292e31,
    shoulder: 0x26372b,
    line: 0xf1efde,
    accent: 0xd4ff43,
    traffic: 8,
    scenery: "forest",
    curveAmplitude: 5.4,
    curveFrequency: 0.0048,
    curvePhase: 2.5,
  },
};

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
  speedBar: document.getElementById("speedBar"),
  gear: document.getElementById("gearLabel"),
  score: document.getElementById("scoreLabel"),
  combo: document.getElementById("comboLabel"),
  difficulty: document.getElementById("difficultyLabel"),
  boost: document.getElementById("boostBar"),
  boostLabel: document.getElementById("boostLabel"),
};

const state = {
  screen: "home",
  vehicle: "silverado",
  map: "city",
  sound: true,
  keys: { left: false, right: false, gas: false, brake: false, boost: false },
  race: null,
  raf: 0,
  gamepadPauseHeld: false,
};

let audioContext = null;
let engineOscillator = null;
let engineGain = null;
let engineBassOscillator = null;
let engineBassGain = null;
let windSource = null;
let windGain = null;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 900);
camera.position.set(0, 3.35, 14.2);

const hemisphere = new THREE.HemisphereLight(0xddeeff, 0x1c1c1c, 2.1);
scene.add(hemisphere);
const sun = new THREE.DirectionalLight(0xffffff, 3.2);
sun.position.set(-12, 24, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
sun.shadow.camera.left = -24;
sun.shadow.camera.right = 24;
sun.shadow.camera.top = 30;
sun.shadow.camera.bottom = -8;
scene.add(sun);

const world = new THREE.Group();
const roadWorld = new THREE.Group();
const trafficWorld = new THREE.Group();
const collectibleWorld = new THREE.Group();
world.add(roadWorld, trafficWorld, collectibleWorld);
scene.add(world);

const SEGMENT_LENGTH = 42;
const SEGMENT_COUNT = 20;
const PLAYER_Z = 4;
const LANE_X = [-5.1, 0, 5.1];
const WORLD_SCALE = 0.24;
const roadSegments = [];
const trafficCars = [];
const collectibleCards = [];
let playerCar = null;
let currentMapTheme = null;

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./vendor/draco/gltf/");
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.setMeshoptDecoder(MeshoptDecoder);
const modelCache = new Map();

function showScreen(name) {
  state.screen = name;
  Object.entries(screens).forEach(function (entry) {
    entry[1].classList.toggle("active", entry[0] === name);
  });
  app.classList.toggle("racing", name === "game");
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  if (name === "game") resizeRenderer();
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
  windSource.buffer = noiseBuffer;
  windSource.loop = true;
  windFilter.type = "bandpass";
  windFilter.frequency.value = 980;
  windFilter.Q.value = 0.55;
  windGain.gain.value = 0;
  windSource.connect(windFilter).connect(windGain).connect(audioContext.destination);
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

function updateBestLabels() {
  document.querySelectorAll("[data-best]").forEach(function (element) {
    const value = Number(localStorage.getItem("tdm-best-" + element.dataset.best));
    element.textContent = value ? "BEST " + formatTime(value) : "BEST —:—";
  });
}

function chooseVehicle(id) {
  state.vehicle = id;
  document.querySelectorAll(".vehicle-select-card").forEach(function (card) {
    const selected = card.dataset.vehicle === id;
    card.classList.toggle("selected", selected);
    card.querySelector(".selected-mark").textContent = selected ? "SEÇİLDİ" : "SEÇ";
  });
}

function chooseMap(id) {
  state.map = id;
  document.querySelectorAll(".map-card").forEach(function (card) {
    card.classList.toggle("selected", card.dataset.map === id);
  });
}

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

document.getElementById("soundButton").addEventListener("click", function (event) {
  state.sound = !state.sound;
  event.currentTarget.textContent = state.sound ? "SOUND ON" : "SOUND OFF";
  if (state.sound) initAudio();
  if (!state.sound && engineGain && audioContext) {
    engineGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
    if (engineBassGain) engineBassGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
    if (windGain) windGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
  }
});

function updateGamepadStatus(connected, name) {
  const label = name || "";
  gamepadStatus.classList.toggle("connected", connected);
  gamepadStatus.innerHTML = "<i></i>" + (connected ? "GAMEPAD READY" + (label ? " · " + label.slice(0, 16) : "") : "GAMEPAD BEKLENİYOR");
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
  if (event.key === "Escape" && state.screen === "game") togglePause();
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
    group.add(tail);
  });
  group.userData.isFallback = true;
  return group;
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
          material.envMapIntensity = 1.25;
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
  let box = new THREE.Box3().setFromObject(root);
  let size = box.getSize(new THREE.Vector3());
  if (size.x > size.z) root.rotation.y += Math.PI / 2;
  root.rotation.y += vehicle.modelRotation;
  root.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(root);
  size = box.getSize(new THREE.Vector3());
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

function addVehicleAccessories(group, vehicle) {
  if (vehicle.tripoModel) {
    group.userData.isPhotoBased = false;
    group.userData.isGeneratedPbrModel = true;
    return group;
  }
  // The single-view AI mesh is kept only as an internal scale reference. It is
  // intentionally not rendered: every visible pixel of the player car comes
  // from real-time 3D geometry, materials, lighting and shadows.
  if (group.children[0]) group.children[0].visible = false;
  if (vehicle.truck) addSilveradoAccessories(group, vehicle);
  else addClkAccessories(group, vehicle);
  group.userData.isPhotoBased = false;
  return group;
}

async function createPlayerVehicle(vehicle) {
  modelStatus.className = "model-status";
  modelStatus.textContent = "PBR 3B ARAÇ YÜKLENİYOR";
  try {
    const gltf = await warmVehicleModel(vehicle);
    const imported = normalizeImportedCar(gltf.scene, vehicle);
    const finishedModel = addVehicleAccessories(imported, vehicle);
    modelStatus.className = "model-status ready";
    modelStatus.textContent = "TRIPO PBR 3B MODEL · AKTİF";
    return finishedModel;
  } catch (error) {
    console.warn("GLB model yüklenemedi, yerel 3B yedek kullanılıyor.", error);
    modelStatus.className = "model-status warn";
    modelStatus.textContent = "3B YEDEK MODEL · GLB BEKLENİYOR";
    return createFallbackVehicle(vehicle);
  }
}

function createCityScenery(side, index, map) {
  const width = 5 + (index % 3) * 2;
  const height = 10 + (index % 5) * 5;
  const depth = 5 + ((index + 2) % 4) * 2;
  const material = new THREE.MeshStandardMaterial({
    color: index % 2 ? 0x161d2d : 0x29223a,
    roughness: 0.82,
    metalness: 0.12,
    emissive: index % 3 ? 0x090d1b : 0x28100d,
    emissiveIntensity: 0.8,
  });
  const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  building.position.set(side * (15 + (index % 4) * 3), height / 2 - 0.05, (index % 3 - 1) * 8);
  building.castShadow = true;
  building.receiveShadow = true;
  const beacon = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.7, 0.18, depth * 0.08),
    new THREE.MeshBasicMaterial({ color: map.accent }),
  );
  beacon.position.set(building.position.x, Math.min(height - 1.4, height * 0.72), building.position.z + depth * 0.51);
  const group = new THREE.Group();
  group.add(building, beacon);
  return group;
}

function createCanyonScenery(side, index) {
  const color = index % 2 ? 0x7b3523 : 0x9f4b2b;
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(3.5 + (index % 4) * 1.2, 0),
    makeMaterial(color, 0.96, 0),
  );
  rock.scale.set(1.1, 1.5 + (index % 3) * 0.5, 0.8);
  rock.position.set(side * (15 + (index % 5) * 3.5), rock.scale.y * 1.8, (index % 3 - 1) * 8);
  rock.rotation.set(0.2 * index, 0.37 * index, -0.07 * side);
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

function createForestScenery(side, index) {
  const group = new THREE.Group();
  const height = 6 + (index % 5) * 1.4;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, height * 0.42, 8), makeMaterial(0x4b3527, 1, 0));
  trunk.position.y = height * 0.21;
  const crownMaterial = makeMaterial(index % 2 ? 0x173b2c : 0x23513a, 0.94, 0);
  for (let level = 0; level < 3; level += 1) {
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(2.2 - level * 0.34, height * 0.46, 10),
      crownMaterial,
    );
    crown.position.y = height * (0.45 + level * 0.18);
    crown.castShadow = true;
    group.add(crown);
  }
  group.add(trunk);
  group.position.set(side * (14 + (index % 6) * 2.5), 0, (index % 3 - 1) * 8);
  return group;
}

function buildRoad(map) {
  roadWorld.clear();
  roadSegments.length = 0;
  scene.background = new THREE.Color(map.sky);
  scene.fog = new THREE.FogExp2(map.fog, map.fogDensity);
  hemisphere.color.set(map.scenery === "canyon" ? 0xffd6a0 : 0xdcecff);
  hemisphere.groundColor.set(map.scenery === "forest" ? 0x18261d : 0x252024);
  sun.color.set(map.scenery === "canyon" ? 0xffc28f : 0xffffff);
  sun.intensity = map.scenery === "city" ? 2.2 : 3.6;

  const roadMaterial = makeMaterial(map.road, 0.88, 0.05);
  const shoulderMaterial = makeMaterial(map.shoulder, 0.93, 0.02);
  const lineMaterial = new THREE.MeshStandardMaterial({
    color: map.line,
    roughness: 0.45,
    emissive: map.scenery === "city" ? 0x29364c : 0x000000,
    emissiveIntensity: 0.55,
  });
  const railMaterial = makeMaterial(0xbac1c8, 0.34, 0.72);

  for (let index = 0; index < SEGMENT_COUNT; index += 1) {
    const segment = new THREE.Group();
    segment.position.z = 16 - index * SEGMENT_LENGTH;
    const road = new THREE.Mesh(new THREE.BoxGeometry(18, 0.16, SEGMENT_LENGTH + 0.2), roadMaterial);
    road.position.y = -0.12;
    road.receiveShadow = true;
    segment.add(road);

    [-1, 1].forEach(function (side) {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, SEGMENT_LENGTH + 0.2), shoulderMaterial);
      shoulder.position.set(side * 13, -0.17, 0);
      shoulder.receiveShadow = true;
      segment.add(shoulder);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.45, SEGMENT_LENGTH), railMaterial);
      rail.position.set(side * 9.7, 0.48, 0);
      rail.castShadow = true;
      segment.add(rail);
    });

    [-2.55, 2.55].forEach(function (laneX) {
      for (let dash = 0; dash < 6; dash += 1) {
        const mark = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 3.4), lineMaterial);
        mark.position.set(laneX, 0.01, -SEGMENT_LENGTH / 2 + 4 + dash * 7);
        segment.add(mark);
      }
    });

    for (let side = -1; side <= 1; side += 2) {
      for (let item = 0; item < 2; item += 1) {
        const seed = index * 5 + item * 2 + (side > 0 ? 1 : 0);
        let scenery;
        if (map.scenery === "city") scenery = createCityScenery(side, seed, map);
        else if (map.scenery === "canyon") scenery = createCanyonScenery(side, seed);
        else scenery = createForestScenery(side, seed);
        scenery.position.z += item ? 9 : -10;
        segment.add(scenery);
      }
    }

    roadWorld.add(segment);
    roadSegments.push(segment);
  }
  currentMapTheme = map.id;
}

function createTrafficVehicle(index) {
  const palette = [0x1d2737, 0xc7c9c6, 0x8b1520, 0x305d75, 0xd98a22, 0x252525];
  const template = { color: palette[index % palette.length], truck: index % 5 === 0 };
  const vehicle = {
    color: template.color,
    truck: template.truck,
  };
  const car = createFallbackVehicle(vehicle, template.color);
  const scale = template.truck ? 0.86 : 0.79 + (index % 3) * 0.04;
  car.scale.setScalar(scale);
  car.userData.speed = 58 + (index * 17) % 74;
  car.userData.lane = index % 3;
  car.userData.targetLane = index % 3;
  car.userData.laneX = LANE_X[index % 3];
  car.userData.changeTimer = 1.5 + (index % 4) * 0.8;
  car.userData.cooldown = 0;
  return car;
}

function buildTraffic(map) {
  trafficWorld.clear();
  trafficCars.length = 0;
  for (let index = 0; index < map.traffic; index += 1) {
    const car = createTrafficVehicle(index);
    car.position.set(car.userData.laneX, 0.02, -55 - index * 56 - (index % 3) * 19);
    trafficWorld.add(car);
    trafficCars.push(car);
  }
}

function buildCollectibles(map) {
  collectibleWorld.clear();
  collectibleCards.length = 0;
  map.pages.forEach(function (distance, index) {
    const group = new THREE.Group();
    const glow = new THREE.PointLight(map.accent, 3.2, 12);
    glow.position.y = 2.1;
    const card = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 1.45, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0xf3efe4,
        roughness: 0.55,
        emissive: map.accent,
        emissiveIntensity: 0.08,
      }),
    );
    card.position.y = 1.55;
    card.castShadow = true;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.14, 0.04),
      new THREE.MeshBasicMaterial({ color: map.accent }),
    );
    stripe.position.set(0, 1.88, 0.07);
    group.add(card, stripe, glow);
    group.userData.distance = distance;
    group.userData.index = index;
    group.userData.collected = false;
    group.userData.laneX = LANE_X[map.pageLanes[index] + 1];
    group.position.x = group.userData.laneX;
    collectibleWorld.add(group);
    collectibleCards.push(group);
  });
}

function resizeRenderer() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener("resize", resizeRenderer);

async function startRace() {
  initAudio();
  const vehicle = vehicles[state.vehicle];
  const map = maps[state.map];
  state.race = {
    active: false,
    paused: false,
    finished: false,
    speed: 0,
    distance: 0,
    elapsed: 0,
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
    difficultyLevel: 1,
    nextDifficultyDistance: 360,
    cleanRun: true,
    finishPending: false,
    impactShake: 0,
    offRoad: false,
    pages: new Set(),
    lastTime: performance.now(),
    vehicle,
    map,
    collisionCooldown: 0,
  };
  hud.vehicleImage.src = vehicle.image;
  hud.vehicle.textContent = vehicle.name;
  hud.vehicleClass.textContent = vehicle.className;
  hud.map.textContent = map.name;
  hud.pages.innerHTML = Array.from({ length: 4 }, function (_, index) {
    return '<i class="page-pip" data-pip="' + index + '"></i>';
  }).join("");
  updateHud();
  showScreen("game");
  screens.game.classList.remove("boosting", "impact", "offroad");
  pausePanel.classList.remove("show");
  if (currentMapTheme !== map.id) buildRoad(map);
  buildTraffic(map);
  buildCollectibles(map);

  if (playerCar) scene.remove(playerCar);
  playerCar = await createPlayerVehicle(vehicle);
  if (!state.race || state.race.vehicle.id !== vehicle.id || state.screen !== "game") return;
  playerCar.position.set(0, 0.02, PLAYER_Z);
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
    }
  }, 760);
}

function togglePause() {
  const race = state.race;
  if (!race || race.finished || !race.active) return;
  race.paused = !race.paused;
  pausePanel.classList.toggle("show", race.paused);
  race.lastTime = performance.now();
  updateAudio(race.speed, race.vehicle.maxSpeed, !race.paused, race.boostActive);
}

document.getElementById("pauseButton").addEventListener("click", togglePause);
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
  screens.game.classList.remove("boosting", "impact", "offroad");
  pausePanel.classList.remove("show");
  showScreen(target);
}

function roadCurveAt(z, race) {
  const map = race.map;
  const distanceAhead = (PLAYER_Z - z) / WORLD_SCALE;
  const currentPhase = race.distance * map.curveFrequency + map.curvePhase;
  const aheadPhase = (race.distance + distanceAhead) * map.curveFrequency + map.curvePhase;
  return map.curveAmplitude * (Math.sin(aheadPhase) - Math.sin(currentPhase));
}

function roadHeadingAt(z, race) {
  const sample = 7;
  const near = roadCurveAt(z + sample, race);
  const far = roadCurveAt(z - sample, race);
  return Math.atan2(far - near, sample * 2);
}

function addScore(points, comboStep) {
  const race = state.race;
  if (!race) return;
  race.score += Math.round(points * race.combo);
  if (comboStep) race.combo = Math.min(5, race.combo + comboStep);
  race.comboTimer = 4.2;
}

function addDifficultyTraffic(race) {
  if (trafficCars.length >= race.map.traffic + 5) return;
  const index = trafficCars.length;
  const car = createTrafficVehicle(index);
  const lane = Math.floor(Math.random() * 3);
  car.userData.lane = lane;
  car.userData.targetLane = lane;
  car.userData.laneX = LANE_X[lane];
  car.userData.speed = 42 + Math.random() * (84 + race.difficultyLevel * 5);
  car.userData.changeTimer = 0.7 + Math.random() * 1.6;
  car.position.set(car.userData.laneX, 0.02, -310 - index * 32 - Math.random() * 110);
  trafficWorld.add(car);
  trafficCars.push(car);
}

function updateDifficulty() {
  const race = state.race;
  if (!race || !race.cleanRun || race.difficultyLevel >= 6 || race.distance < race.nextDifficultyDistance) return;
  race.difficultyLevel += 1;
  race.nextDifficultyDistance += Math.max(260, 390 - race.difficultyLevel * 22);
  addDifficultyTraffic(race);
  addScore(350 * race.difficultyLevel, 0.2);
  playTone(390 + race.difficultyLevel * 75, 0.22, "square", 0.032);
  showToast("SEVİYE " + race.difficultyLevel + " · TRAFİK YOĞUNLAŞTI", false, "↑");
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
  playTone(88, 0.22, "sawtooth", 0.055);
  showToast("ÇARPIŞMA · OYUN BİTTİ", true, "!");
  window.setTimeout(function () {
    if (state.race === race) finishRace("crash");
  }, 420);
}

function recycleTraffic(car, index) {
  const difficulty = state.race ? state.race.difficultyLevel : 1;
  const spacing = Math.max(25, 39 - difficulty * 2.2);
  car.position.z = -340 - index * spacing - Math.random() * (170 / Math.sqrt(difficulty));
  car.userData.lane = Math.floor(Math.random() * 3);
  car.userData.targetLane = car.userData.lane;
  car.userData.laneX = LANE_X[car.userData.lane];
  car.position.x = car.userData.laneX;
  car.userData.speed = 46 + Math.random() * (88 + difficulty * 6);
  car.userData.changeTimer = (1 + Math.random() * 3.6) / (1 + (difficulty - 1) * 0.16);
  car.userData.cooldown = 0;
}

function updateWorld(dt, time) {
  const race = state.race;
  const travel = race.speed * dt * WORLD_SCALE;
  roadSegments.forEach(function (segment) {
    segment.position.z += travel;
    if (segment.position.z > 37) segment.position.z -= SEGMENT_LENGTH * SEGMENT_COUNT;
    segment.position.x = roadCurveAt(segment.position.z, race);
    segment.rotation.y = roadHeadingAt(segment.position.z, race);
  });

  trafficCars.forEach(function (car, index) {
    if (race.finishPending || race.finished) return;
    const previousZ = car.position.z;
    const relative = (race.speed - car.userData.speed) * dt * WORLD_SCALE;
    car.position.z += relative;
    car.userData.cooldown = Math.max(0, car.userData.cooldown - dt);
    car.userData.changeTimer -= dt;
    if (car.position.z > 24 || car.position.z < -760) recycleTraffic(car, index);
    if (car.userData.changeTimer <= 0 && car.position.z < -42) {
      const direction = Math.random() > 0.5 ? 1 : -1;
      car.userData.targetLane = THREE.MathUtils.clamp(car.userData.lane + direction, 0, 2);
      car.userData.lane = car.userData.targetLane;
      car.userData.changeTimer = (3.5 + Math.random() * 5.5) / (1 + (race.difficultyLevel - 1) * 0.24);
    }
    const laneChangeGrip = Math.max(0.09, 0.18 - (race.difficultyLevel - 1) * 0.015);
    car.userData.laneX = THREE.MathUtils.lerp(car.userData.laneX, LANE_X[car.userData.targetLane], 1 - Math.pow(laneChangeGrip, dt));
    const curveX = roadCurveAt(car.position.z, race);
    car.position.x = car.userData.laneX + curveX;
    car.rotation.y = THREE.MathUtils.lerp(car.rotation.y, roadHeadingAt(car.position.z, race), 1 - Math.pow(0.02, dt));
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
      addScore(420, 0.35);
      playTone(620 + Math.min(4, race.combo) * 80, 0.11, "square", 0.025);
      showToast("YAKIN GEÇİŞ · +" + Math.round(420 * race.combo), false, "×");
    }
  });

  collectibleCards.forEach(function (card) {
    if (card.userData.collected) return;
    const delta = card.userData.distance - race.distance;
    card.position.z = PLAYER_Z - delta * WORLD_SCALE;
    card.position.x = card.userData.laneX + roadCurveAt(card.position.z, race);
    card.rotation.y = time * 1.6 + card.userData.index;
    card.visible = delta > -35 && delta < 900;
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
  if (race.boostActive && !race.boostWasActive) playTone(210, 0.17, "sawtooth", 0.025);
  race.boostWasActive = race.boostActive;

  if (input.gas > 0) race.speed += vehicle.acceleration * input.gas * (1 - Math.min(0.62, initialSpeedRatio * 0.55)) * dt;
  else race.speed -= (8 + initialSpeedRatio * 8) * dt;
  if (input.brake > 0) race.speed -= vehicle.brake * input.brake * dt;

  race.speed -= initialSpeedRatio * initialSpeedRatio * 3.2 * dt;
  const speedRatio = THREE.MathUtils.clamp(race.speed / vehicle.maxSpeed, 0, 1.2);
  race.steer = THREE.MathUtils.lerp(race.steer, input.steer, 1 - Math.pow(0.002, dt));
  race.playerX += input.steer * vehicle.handling * (4.25 + Math.min(1, speedRatio) * 2.2) * dt;
  race.playerX *= Math.pow(0.9984, dt * 60);
  race.offRoad = Math.abs(race.playerX) > 7.25;
  if (race.offRoad) race.speed -= (54 + race.speed * 0.14) * dt;
  race.playerX = THREE.MathUtils.clamp(race.playerX, -9, 9);
  const dynamicTopSpeed = vehicle.maxSpeed * (race.boostActive ? 1.14 : 1);
  race.speed = THREE.MathUtils.clamp(race.speed, 0, dynamicTopSpeed);
  race.maxSpeed = Math.max(race.maxSpeed, race.speed);
  race.distance += race.speed * dt * 0.36;
  race.elapsed += dt;
  race.score += race.speed * dt * 0.2 * race.combo;
  updateDifficulty();
  race.comboTimer = Math.max(0, race.comboTimer - dt);
  if (race.comboTimer <= 0) race.combo = THREE.MathUtils.lerp(race.combo, 1, 1 - Math.pow(0.05, dt));
  race.collisionCooldown = Math.max(0, race.collisionCooldown - dt);
  race.impactShake = Math.max(0, race.impactShake - dt * 3.8);

  screens.game.classList.toggle("boosting", race.boostActive);
  screens.game.classList.toggle("offroad", race.offRoad);
  driveEffects.style.setProperty("--speed-intensity", Math.max(0, Math.min(1, (speedRatio - 0.46) / 0.54)).toFixed(3));

  if (playerCar) {
    playerCar.position.x = THREE.MathUtils.lerp(playerCar.position.x, race.playerX, 1 - Math.pow(0.0003, dt));
    const roadRumble = race.offRoad ? Math.sin(time * 54) * 0.055 : Math.sin(race.distance * 0.08) * speedRatio * 0.025;
    playerCar.position.y = 0.02 + roadRumble;
    playerCar.rotation.y = THREE.MathUtils.lerp(
      playerCar.rotation.y,
      vehicle.viewYaw - race.steer * 0.24,
      1 - Math.pow(0.001, dt),
    );
    playerCar.rotation.z = THREE.MathUtils.lerp(playerCar.rotation.z, -race.steer * speedRatio * 0.035, 1 - Math.pow(0.001, dt));
  }

  updateWorld(dt, time);
  if (race.finishPending) {
    updateAudio(0, vehicle.maxSpeed, false);
    updateHud();
    return;
  }
  if (race.distance >= race.map.distance || race.elapsed >= race.map.timeLimit) finishRace();
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
  const pip = hud.pages.querySelector('[data-pip="' + index + '"]');
  if (pip) pip.classList.add("on");
  addScore(900, 0.5);
  playTone(760 + index * 110, 0.22, "sine", 0.045);
  showToast("KAYIP ÇİZİM · +" + Math.round(900 * race.combo), false, "+");
}

function updateHud() {
  const race = state.race;
  if (!race) return;
  const progress = Math.min(100, race.distance / race.map.distance * 100);
  hud.progress.style.width = progress + "%";
  hud.distance.textContent = (race.distance / 1000).toFixed(1) + " / " + (race.map.distance / 1000).toFixed(1) + " KM";
  hud.time.textContent = formatTime(race.elapsed);
  hud.pageCounter.textContent = race.pages.size + " / 4";
  hud.speed.textContent = Math.round(race.speed).toString().padStart(3, "0");
  hud.speedBar.style.width = Math.min(100, race.speed / race.vehicle.maxSpeed * 100) + "%";
  hud.gear.textContent = race.speed < 3 ? "N" : Math.min(6, Math.max(1, Math.ceil(race.speed / 38))).toString();
  hud.score.textContent = Math.round(race.score).toString().padStart(6, "0");
  hud.combo.textContent = "×" + race.combo.toFixed(1);
  hud.combo.classList.toggle("hot", race.combo >= 2);
  hud.difficulty.textContent = "SEVİYE " + race.difficultyLevel;
  hud.boost.style.width = race.boost.toFixed(1) + "%";
  hud.boostLabel.textContent = Math.round(race.boost).toString().padStart(2, "0");
}

function finishRace(reason) {
  const race = state.race;
  if (!race || race.finished) return;
  const crashed = reason === "crash";
  race.finished = true;
  race.finishPending = false;
  race.active = false;
  race.boostActive = false;
  updateAudio(0, race.vehicle.maxSpeed, false);
  screens.game.classList.remove("boosting", "offroad");
  const pages = race.pages.size;
  const finishedDistance = race.distance >= race.map.distance;
  const timedOut = !crashed && !finishedDistance;
  if (finishedDistance && !crashed) {
    const bestKey = "tdm-best-" + race.map.id;
    const previousBest = Number(localStorage.getItem(bestKey));
    if (!previousBest || race.elapsed < previousBest) localStorage.setItem(bestKey, race.elapsed.toFixed(2));
  }
  const grade = crashed ? "X" : !finishedDistance ? "C" : pages === 4 ? "S" : pages >= 3 ? "A" : pages >= 2 ? "B" : "C";
  document.getElementById("resultKicker").textContent = crashed ? "RUN ENDED · COLLISION" : timedOut ? "RUN ENDED · TIME" : "ROUTE COMPLETE";
  document.getElementById("resultTitle").innerHTML = crashed ? "TEK HATA.<br />KOŞU BİTTİ." : timedOut ? "ZAMAN<br />DOLDU." : "KOLEKSİYONA<br />YENİ BİR HİKÂYE.";
  document.getElementById("resultImage").src = race.vehicle.resultImage;
  const resultGrade = document.getElementById("resultGrade");
  resultGrade.textContent = grade;
  resultGrade.classList.toggle("crash", crashed);
  document.getElementById("resultTime").textContent = formatTime(race.elapsed);
  document.getElementById("resultPages").textContent = pages + " / 4";
  document.getElementById("resultSpeed").textContent = Math.round(race.maxSpeed) + " KM/H";
  document.getElementById("resultScore").textContent = Math.round(race.score).toString().padStart(6, "0");
  document.getElementById("resultMessage").textContent = crashed
    ? "Çarpışma koşuyu bitirdi. Temiz sürüşte " + race.difficultyLevel + ". seviyeye ve " + (race.distance / 1000).toFixed(1) + " kilometreye ulaştın."
    : finishedDistance
    ? pages === 4
      ? "Tüm kayıp çizimler bulundu. Bu rota koleksiyona başarıyla işlendi."
      : 4 - pages + " çizim sayfası yolda kaldı. Rotayı tekrar sürerek koleksiyonu tamamlayabilirsin."
    : "Süre doldu. Trafiği daha temiz geçerek ve hızını koruyarak tekrar dene.";
  window.setTimeout(function () { showScreen("result"); }, 500);
}

function renderScene(time) {
  const race = state.race;
  if (!race) return;
  const speedRatio = THREE.MathUtils.clamp(race.speed / race.vehicle.maxSpeed, 0, 1.2);
  const targetCameraX = race.playerX * 0.72;
  const shake = race.impactShake;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCameraX, 0.075) + Math.sin(time * 71) * shake * 0.16;
  camera.position.y = 3.35 + speedRatio * 0.34 + Math.sin(time * (race.offRoad ? 48 : 28)) * (speedRatio * 0.014 + (race.offRoad ? 0.035 : 0)) + Math.cos(time * 63) * shake * 0.1;
  camera.position.z = 14.2 - speedRatio * 0.72 - (race.boostActive ? 0.38 : 0);
  const targetFov = 56 + speedRatio * 6.5 + (race.boostActive ? 4.5 : 0);
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.07);
  camera.updateProjectionMatrix();
  camera.lookAt(race.playerX * 0.34, 0.75, -10.5 - speedRatio * 3.6);
  camera.rotation.z -= race.steer * speedRatio * 0.012;
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
chooseVehicle("silverado");
chooseMap("city");
