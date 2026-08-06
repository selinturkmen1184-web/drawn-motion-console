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
    rideHeight: 0.025,
    materialBoost: 1.18,
    cameraHeightBias: 0.06,
    cameraDistanceBias: 0.8,
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
    targetLength: 4.64,
    targetWidth: 1.78,
    targetHeight: 1.38,
    wheelBase: 1.38,
    wheelRadius: 0.42,
    color: 0xa66f53,
    modelRotation: -0.55,
    rideHeight: 0.012,
    materialBoost: 1.42,
    cameraHeightBias: 0.08,
    cameraDistanceBias: 1.15,
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
    sky: 0x030914,
    fog: 0x0b1525,
    fogDensity: 0.0055,
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
    sky: 0x8f402e,
    fog: 0x713726,
    fogDensity: 0.0045,
    road: 0x211c1b,
    shoulder: 0x5a271d,
    line: 0xffe7c0,
    accent: 0xff7152,
    traffic: 7,
    scenery: "canyon",
    backdrop: "./maps/red-rock-photo-v1.jpg",
  },
  forest: {
    id: "forest",
    name: "ALPINE INK RUN",
    distance: 2600,
    timeLimit: 72,
    pages: [390, 1050, 1720, 2310],
    pageLanes: [0, 1, -1, 0],
    sky: 0x527173,
    fog: 0x354e51,
    fogDensity: 0.0065,
    road: 0x162024,
    shoulder: 0x152b24,
    line: 0xdcefdc,
    accent: 0x91ffc7,
    traffic: 8,
    scenery: "forest",
    backdrop: "./maps/alpine-photo-v1.jpg",
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
  boost: document.getElementById("boostBar"),
  boostLabel: document.getElementById("boostLabel"),
  radar: document.getElementById("trafficRadar"),
  cameraButton: document.getElementById("cameraButton"),
};

const radarMarkers = Array.from({ length: 10 }, function () {
  const marker = document.createElement("i");
  hud.radar.appendChild(marker);
  return marker;
});

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
renderer.toneMappingExposure = 0.98;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 900);
camera.position.set(0, 2.55, 10.15);

const hemisphere = new THREE.HemisphereLight(0xcceeff, 0x111722, 2.25);
scene.add(hemisphere);
const sun = new THREE.DirectionalLight(0xf2f8ff, 3.05);
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
const environmentTextureCache = new Map();
const textureLoader = new THREE.TextureLoader();
let cityFacadeTexture = null;
let pineTexture = null;

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
    const value = Number(localStorage.getItem("tdm-survival-best-" + element.dataset.best));
    element.textContent = value ? "BEST " + (value / 1000).toFixed(1) + " KM" : "BEST — KM";
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
  if ((event.key === "c" || event.key === "C") && state.screen === "game") {
    event.preventDefault();
    cycleCameraMode();
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

function createAsphaltTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 192;
  textureCanvas.height = 384;
  const context = textureCanvas.getContext("2d");
  context.fillStyle = "#c2c3c4";
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  for (let index = 0; index < 5200; index += 1) {
    const tone = 145 + (index * 37) % 68;
    context.fillStyle = "rgb(" + tone + "," + tone + "," + tone + ")";
    context.globalAlpha = 0.12 + ((index * 13) % 30) / 100;
    const x = (index * 67) % textureCanvas.width;
    const y = (index * 109) % textureCanvas.height;
    context.fillRect(x, y, 1 + (index % 3), 1 + (index % 2));
  }
  context.globalAlpha = 0.1;
  context.strokeStyle = "#56585b";
  context.lineWidth = 2;
  [42, 76, 118, 151].forEach(function (x, index) {
    context.beginPath();
    context.moveTo(x, 0);
    context.bezierCurveTo(x + 3, 120, x - 4, 250, x + index - 2, 384);
    context.stroke();
  });
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.6, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function applyMapBackdrop(map) {
  scene.background = new THREE.Color(map.sky);
  if (!map.backdrop) return;
  if (environmentTextureCache.has(map.id)) {
    scene.background = environmentTextureCache.get(map.id);
    return;
  }
  textureLoader.load(map.backdrop, function (texture) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    environmentTextureCache.set(map.id, texture);
    if (currentMapTheme === map.id || (state.race && state.race.map.id === map.id)) scene.background = texture;
  });
}

function createTerrainTexture(map) {
  const terrainCanvas = document.createElement("canvas");
  terrainCanvas.width = 256;
  terrainCanvas.height = 512;
  const context = terrainCanvas.getContext("2d");
  const palette = map.scenery === "canyon"
    ? ["#5c3528", "#754633", "#38251f", "#9a6445"]
    : map.scenery === "forest"
      ? ["#182d25", "#294238", "#101d18", "#4b5546"]
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

function getPineTexture() {
  if (pineTexture) return pineTexture;
  const pineCanvas = document.createElement("canvas");
  pineCanvas.width = 256;
  pineCanvas.height = 512;
  const context = pineCanvas.getContext("2d");
  context.clearRect(0, 0, 256, 512);
  const trunkGradient = context.createLinearGradient(110, 0, 146, 0);
  trunkGradient.addColorStop(0, "rgba(40,32,25,.92)");
  trunkGradient.addColorStop(0.5, "rgba(88,66,45,.98)");
  trunkGradient.addColorStop(1, "rgba(34,27,22,.9)");
  context.fillStyle = trunkGradient;
  context.fillRect(116, 238, 24, 258);
  const foliage = [
    [128, 18, 26, 220], [128, 72, 48, 258], [128, 132, 73, 300],
    [128, 204, 101, 350], [128, 282, 120, 408],
  ];
  foliage.forEach(function (layer, index) {
    const gradient = context.createLinearGradient(0, layer[1], 0, layer[3]);
    gradient.addColorStop(0, index % 2 ? "rgba(50,103,78,.98)" : "rgba(37,84,65,.98)");
    gradient.addColorStop(1, "rgba(10,38,30,.98)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(layer[0], layer[1]);
    context.lineTo(layer[0] + layer[2] * 0.45, layer[1] + (layer[3] - layer[1]) * 0.45);
    context.lineTo(layer[0] + layer[2] * 0.7, layer[1] + (layer[3] - layer[1]) * 0.62);
    context.lineTo(layer[0] + layer[2], layer[3]);
    context.lineTo(layer[0], layer[3] - 18);
    context.lineTo(layer[0] - layer[2], layer[3]);
    context.lineTo(layer[0] - layer[2] * 0.66, layer[1] + (layer[3] - layer[1]) * 0.61);
    context.lineTo(layer[0] - layer[2] * 0.42, layer[1] + (layer[3] - layer[1]) * 0.44);
    context.closePath();
    context.fill();
  });
  pineTexture = new THREE.CanvasTexture(pineCanvas);
  pineTexture.colorSpace = THREE.SRGBColorSpace;
  pineTexture.minFilter = THREE.LinearMipmapLinearFilter;
  return pineTexture;
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
          material.envMapIntensity = vehicle.materialBoost || 1.25;
          material.roughness = THREE.MathUtils.clamp((material.roughness === undefined ? 0.5 : material.roughness) * (vehicle.truck ? 0.92 : 0.78), 0.16, 0.76);
          material.metalness = THREE.MathUtils.clamp(material.metalness === undefined ? 0.18 : material.metalness, 0.04, 0.88);
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
    const tailGlow = new THREE.PointLight(0xff2038, 0.72, 3.2, 2.15);
    tailGlow.position.set(side * tailOffset, lampHeight, rearZ);
    group.add(tailGlow);
    group.userData.playerTailLights.push(tailGlow);

    const target = new THREE.Object3D();
    target.position.set(side * headlightOffset * 0.38, 0.06, frontZ - 24);
    const headlight = new THREE.SpotLight(0xd9efff, 24, 50, Math.PI / 8, 0.78, 1.5);
    headlight.position.set(side * headlightOffset, lampHeight, frontZ);
    headlight.target = target;
    group.add(headlight, target);
    group.userData.headlights.push(headlight);
  });
  return group;
}

async function createPlayerVehicle(vehicle) {
  modelStatus.className = "model-status";
  modelStatus.textContent = "PBR 3B ARAÇ YÜKLENİYOR";
  try {
    const gltf = await warmVehicleModel(vehicle);
    const imported = normalizeImportedCar(gltf.scene, vehicle);
    const finishedModel = addPlayerLights(addVehicleAccessories(imported, vehicle), vehicle);
    modelStatus.className = "model-status ready";
    modelStatus.textContent = "TRIPO PBR 3B MODEL · AKTİF";
    return finishedModel;
  } catch (error) {
    console.warn("GLB model yüklenemedi, yerel 3B yedek kullanılıyor.", error);
    modelStatus.className = "model-status warn";
    modelStatus.textContent = "3B YEDEK MODEL · GLB BEKLENİYOR";
    return addPlayerLights(createFallbackVehicle(vehicle), vehicle);
  }
}

function createCityScenery(side, index, map) {
  const width = 5 + (index % 3) * 2;
  const height = 10 + (index % 5) * 5;
  const depth = 5 + ((index + 2) % 4) * 2;
  const facade = getCityFacadeTexture();
  const material = new THREE.MeshStandardMaterial({
    color: index % 2 ? 0x101a29 : 0x172538,
    map: facade,
    emissiveMap: facade,
    roughness: 0.48,
    metalness: 0.34,
    emissive: index % 3 ? 0x102b45 : 0x17435a,
    emissiveIntensity: 1.18,
  });
  const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  building.position.set(side * (19 + (index % 4) * 3.6), height / 2 - 0.05, (index % 3 - 1) * 8);
  building.castShadow = true;
  building.receiveShadow = true;
  const beacon = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.72, 0.1, depth * 0.055),
    new THREE.MeshBasicMaterial({ color: map.accent }),
  );
  beacon.position.set(building.position.x, Math.min(height - 1.4, height * 0.72), building.position.z + depth * 0.51);
  const group = new THREE.Group();
  group.add(building, beacon);
  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.72, Math.max(1.6, height * 0.15), depth * 0.72),
    material.clone(),
  );
  crown.position.set(building.position.x, height + crown.geometry.parameters.height * 0.45, building.position.z);
  crown.castShadow = true;
  group.add(crown);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width * 0.38, 0.7, depth * 0.38),
    makeMaterial(0x111820, 0.55, 0.58),
  );
  roof.position.set(building.position.x, height + crown.geometry.parameters.height + 0.18, building.position.z);
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.055, 3.2 + (index % 3), 8),
    makeMaterial(0x8998a5, 0.28, 0.82),
  );
  antenna.position.set(building.position.x, roof.position.y + 1.8, building.position.z);
  group.add(roof, antenna);
  return group;
}

function createCanyonScenery(side, index) {
  const group = new THREE.Group();
  const rockMaterial = makeMaterial(index % 2 ? 0x4f3027 : 0x69402f, 0.98, 0);
  for (let item = 0; item < 3; item += 1) {
    const radius = 0.75 + ((index + item * 2) % 4) * 0.34;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 0), rockMaterial);
    rock.scale.set(1.4 + item * 0.22, 0.48 + (item % 2) * 0.18, 0.9 + item * 0.12);
    rock.position.set(side * item * 1.15, radius * 0.55, (item - 1) * 2.2);
    rock.rotation.set(index * 0.13 + item, index * 0.28, side * 0.08);
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }
  const scrub = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.72, 1),
    makeMaterial(index % 2 ? 0x4e4b29 : 0x5f5730, 1, 0),
  );
  scrub.scale.set(1.4, 0.62, 1.1);
  scrub.position.set(-side * 1.6, 0.42, 1.7);
  group.add(scrub);
  group.position.set(side * (21.5 + (index % 5) * 2.4), 0, (index % 3 - 1) * 8);
  return group;
}

function createForestScenery(side, index) {
  return new THREE.Group();
}

function buildRoad(map) {
  roadWorld.clear();
  roadSegments.length = 0;
  currentMapTheme = map.id;
  applyMapBackdrop(map);
  scene.fog = new THREE.FogExp2(map.fog, map.fogDensity);
  hemisphere.color.set(map.scenery === "canyon" ? 0xffc7a2 : map.scenery === "forest" ? 0xc9eee5 : 0xbfe8ff);
  hemisphere.groundColor.set(map.scenery === "forest" ? 0x10251f : map.scenery === "canyon" ? 0x342019 : 0x0b1320);
  sun.color.set(map.scenery === "canyon" ? 0xffb584 : map.scenery === "forest" ? 0xd9fff0 : 0xe7f6ff);
  sun.intensity = map.scenery === "city" ? 2.05 : 3.35;

  const roadMaterial = makeMaterial(
    map.road,
    map.scenery === "city" ? 0.48 : map.scenery === "forest" ? 0.7 : 0.84,
    map.scenery === "city" ? 0.16 : 0.04,
  );
  roadMaterial.map = createAsphaltTexture();
  roadMaterial.envMapIntensity = map.scenery === "city" ? 1.45 : 0.7;
  const shoulderMaterial = makeMaterial(map.shoulder, 0.93, 0.02);
  shoulderMaterial.map = createTerrainTexture(map);
  shoulderMaterial.envMapIntensity = 0.42;
  const lineMaterial = new THREE.MeshStandardMaterial({
    color: map.line,
    roughness: 0.45,
    emissive: map.scenery === "city" ? 0x193e53 : 0x000000,
    emissiveIntensity: 0.72,
  });
  const railMaterial = makeMaterial(0xbac1c8, 0.34, 0.72);
  const postMaterial = makeMaterial(0x858d95, 0.46, 0.64);
  const reflectorMaterial = new THREE.MeshStandardMaterial({
    color: map.scenery === "city" ? 0xe9f4ff : 0xffe7aa,
    emissive: map.scenery === "city" ? 0x7bb6e8 : 0xc97c25,
    emissiveIntensity: 2.4,
    roughness: 0.28,
  });
  const edgeGlowMaterial = new THREE.MeshStandardMaterial({
    color: map.accent,
    emissive: map.accent,
    emissiveIntensity: map.scenery === "city" ? 1.8 : 0.82,
    roughness: 0.34,
    metalness: 0.2,
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
    const road = new THREE.Mesh(new THREE.BoxGeometry(18, 0.16, SEGMENT_LENGTH + 1.2), roadMaterial);
    road.position.y = -0.12;
    road.receiveShadow = true;
    segment.add(road);

    const repairMaterial = new THREE.MeshStandardMaterial({
      color: map.scenery === "city" ? 0x0a1018 : 0x171719,
      roughness: 0.68,
      metalness: map.scenery === "city" ? 0.2 : 0.02,
      transparent: true,
      opacity: 0.52,
    });
    if (index % 3 !== 1) {
      const repair = new THREE.Mesh(new THREE.BoxGeometry(2.2 + index % 4, 0.012, 7.5 + index % 5), repairMaterial);
      repair.position.set(index % 2 ? -3.8 : 3.2, -0.02, index % 2 ? -8 : 10);
      repair.rotation.y = (index % 3 - 1) * 0.05;
      segment.add(repair);
    }

    if (map.scenery === "city" && index % 2 === 0) {
      [-1, 1].forEach(function (side) {
        const wetPatch = new THREE.Mesh(
          new THREE.PlaneGeometry(1.5 + index % 3, 5.6 + index % 4),
          new THREE.MeshStandardMaterial({ color: 0x24445d, roughness: 0.12, metalness: 0.48, transparent: true, opacity: 0.2 }),
        );
        wetPatch.rotation.x = -Math.PI / 2;
        wetPatch.position.set(side * (6.2 + index % 2), 0.006, index % 4 * 5 - 9);
        segment.add(wetPatch);
      });
    }

    [-1, 1].forEach(function (side) {
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, SEGMENT_LENGTH + 1.2), shoulderMaterial);
      shoulder.position.set(side * 13, -0.17, 0);
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
          segment.add(pole, arm, lamp);
        });
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
        scenery.position.z += item ? 9 : -10;
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

    roadWorld.add(segment);
    roadSegments.push(segment);
  }
  currentMapTheme = map.id;
}

function createTrafficVehicle(index) {
  const palette = [0x152337, 0xc8d1d3, 0x8f2830, 0x2c6577, 0xb7783d, 0x1c222a];
  const template = { color: palette[index % palette.length], truck: index % 5 === 0 || index % 9 === 6 };
  const vehicle = {
    color: template.color,
    truck: template.truck,
  };
  const car = createFallbackVehicle(vehicle, template.color);
  const scale = template.truck ? 0.86 : 0.79 + (index % 3) * 0.04;
  const widthVariation = template.truck ? 1.02 : 0.92 + (index % 4) * 0.035;
  const lengthVariation = template.truck ? 1.08 : 0.94 + ((index + 2) % 3) * 0.04;
  car.scale.set(scale * widthVariation, scale, scale * lengthVariation);
  car.userData.speed = 58 + (index * 17) % 74;
  car.userData.cruiseSpeed = car.userData.speed;
  car.userData.isTrafficTruck = template.truck;
  car.userData.lane = index % 3;
  car.userData.targetLane = index % 3;
  car.userData.laneX = LANE_X[index % 3];
  car.userData.changeTimer = 1.5 + (index % 4) * 0.8;
  car.userData.cooldown = 0;
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
    const glow = new THREE.PointLight(map.accent, 3.6, 13);
    glow.position.y = 2.1;
    const card = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 1.45, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0xe9efec,
        roughness: 0.55,
        emissive: map.accent,
        emissiveIntensity: 0.15,
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
    lap: 1,
    nextCheckpointDistance: map.distance,
    cameraMode: 0,
    difficultyLevel: 1,
    difficultyStartDistance: 0,
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
  hud.cameraButton.textContent = "CAM 1";
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
  if (playerCar.userData.headlights) {
    const headlightPower = map.scenery === "city" ? 28 : map.scenery === "forest" ? 13 : 4;
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
    }
  }, 760);
}

function cycleCameraMode() {
  const race = state.race;
  if (!race || race.finished) return;
  race.cameraMode = (race.cameraMode + 1) % 3;
  hud.cameraButton.textContent = "CAM " + (race.cameraMode + 1);
  const labels = ["TAKİP KAMERASI", "YAKIN KAMERA", "GENİŞ KAMERA"];
  showToast(labels[race.cameraMode], false, "◉");
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
hud.cameraButton.addEventListener("click", cycleCameraMode);
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
  const car = createTrafficVehicle(index);
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
  showToast("SEVİYE " + race.difficultyLevel + " · TRAFİK YOĞUNLAŞTI", false, "↑");
}

function updateCheckpoint() {
  const race = state.race;
  if (!race || race.distance < race.nextCheckpointDistance) return;
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
  showToast("TUR " + race.lap + " · SURVIVAL DEVAM EDİYOR", false, "◆");
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
}

function updateWorld(dt, time) {
  const race = state.race;
  const travel = race.speed * dt * WORLD_SCALE;
  roadSegments.forEach(function (segment) {
    segment.position.z += travel;
    if (segment.position.z > 37) segment.position.z -= SEGMENT_LENGTH * SEGMENT_COUNT;
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
      race.boost = Math.min(100, race.boost + 14);
      addScore(420, 0.35);
      playTone(620 + Math.min(4, race.combo) * 80, 0.11, "square", 0.025);
      showToast("YAKIN GEÇİŞ · BOOST +14", false, "×");
    }
  });

  collectibleCards.forEach(function (card) {
    if (card.userData.collected) return;
    const delta = card.userData.distance - race.distance;
    card.position.z = PLAYER_Z - delta * WORLD_SCALE;
    card.position.x = card.userData.laneX;
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
  updateCheckpoint();
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
    if (playerCar.userData.playerTailLights) {
      const tailIntensity = input.brake > 0 ? 3.6 : race.boostActive ? 1.15 : 0.72;
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
  const pip = hud.pages.querySelector('[data-pip="' + index + '"]');
  if (pip) pip.classList.add("on");
  addScore(900, 0.5);
  playTone(760 + index * 110, 0.22, "sine", 0.045);
  showToast("KAYIP ÇİZİM · +" + Math.round(900 * race.combo), false, "+");
}

function updateHud() {
  const race = state.race;
  if (!race) return;
  const lapDistance = race.distance % race.map.distance;
  const progress = Math.min(100, lapDistance / race.map.distance * 100);
  hud.progress.style.width = progress + "%";
  hud.map.textContent = race.map.name + " · TUR " + race.lap;
  hud.distance.textContent = (race.distance / 1000).toFixed(1) + " KM · SONRAKİ TUR " + Math.max(0, (race.nextCheckpointDistance - race.distance) / 1000).toFixed(1) + " KM";
  hud.time.textContent = formatTime(race.elapsed);
  hud.pageCounter.textContent = race.pages.size + " / 4";
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
  hud.difficulty.textContent = "SEVİYE " + race.difficultyLevel;
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
  race.finished = true;
  race.finishPending = false;
  race.active = false;
  race.boostActive = false;
  updateAudio(0, race.vehicle.maxSpeed, false);
  screens.game.classList.remove("boosting", "offroad");
  const pages = race.pages.size;
  const bestKey = "tdm-survival-best-" + race.map.id;
  const previousBest = Number(localStorage.getItem(bestKey));
  const newRecord = !previousBest || race.distance > previousBest;
  if (newRecord) localStorage.setItem(bestKey, race.distance.toFixed(1));
  const grade = crashed ? "X" : pages === 4 ? "S" : pages >= 3 ? "A" : pages >= 2 ? "B" : "C";
  document.getElementById("resultKicker").textContent = crashed ? "SURVIVAL ENDED · COLLISION" : "SURVIVAL COMPLETE";
  document.getElementById("resultTitle").innerHTML = crashed ? "TEK HATA.<br />KOŞU BİTTİ." : "YENİ BİR<br />MESAFE REKORU.";
  document.getElementById("resultImage").src = race.vehicle.resultImage;
  const resultGrade = document.getElementById("resultGrade");
  resultGrade.textContent = grade;
  resultGrade.classList.toggle("crash", crashed);
  document.getElementById("resultTime").textContent = formatTime(race.elapsed);
  document.getElementById("resultDistance").textContent = (race.distance / 1000).toFixed(1) + " KM";
  document.getElementById("resultSpeed").textContent = Math.round(race.maxSpeed) + " KM/H";
  document.getElementById("resultScore").textContent = Math.round(race.score).toString().padStart(6, "0");
  document.getElementById("resultMessage").textContent = (newRecord ? "YENİ MESAFE REKORU · " : "")
    + "Tur " + race.lap + ", seviye " + race.difficultyLevel + " ve " + (race.distance / 1000).toFixed(1)
    + " kilometre. " + (pages === 4 ? "Tüm kayıp çizimler bulundu." : (4 - pages) + " çizim sayfası yolda kaldı.");
  window.setTimeout(function () { showScreen("result"); }, 500);
}

function renderScene(time) {
  const race = state.race;
  if (!race) return;
  const speedRatio = THREE.MathUtils.clamp(race.speed / race.vehicle.maxSpeed, 0, 1.2);
  const cameraModes = [
    { follow: 0.78, y: 2.55, z: 10.15, fov: 58, look: 0.38, lookY: 0.9, lookZ: -14.5 },
    { follow: 0.9, y: 1.82, z: 7.15, fov: 62, look: 0.5, lookY: 0.98, lookZ: -17.5 },
    { follow: 0.6, y: 3.85, z: 15.6, fov: 64, look: 0.28, lookY: 0.72, lookZ: -10.5 },
  ];
  const view = cameraModes[race.cameraMode] || cameraModes[0];
  const targetCameraX = race.playerX * view.follow;
  const shake = race.impactShake;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCameraX, 0.075) + Math.sin(time * 71) * shake * 0.16;
  const cameraRumble = Math.sin(time * (race.offRoad ? 48 : 28)) * (speedRatio * 0.014 + (race.offRoad ? 0.035 : 0));
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, view.y + (race.vehicle.cameraHeightBias || 0) + speedRatio * 0.24, 0.075) + cameraRumble + Math.cos(time * 63) * shake * 0.1;
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, view.z + (race.vehicle.cameraDistanceBias || 0) - speedRatio * 0.58 - (race.boostActive ? 0.32 : 0), 0.075);
  const targetFov = view.fov + speedRatio * 6.5 + (race.boostActive ? 4.5 : 0);
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.07);
  camera.updateProjectionMatrix();
  camera.lookAt(race.playerX * view.look, view.lookY, view.lookZ - speedRatio * 3.6);
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
