(() => {
  "use strict";

  const vehicles = {
    silverado: {
      id: "silverado",
      name: "OVERLAND SILVERADO",
      className: "ADVENTURE CLASS",
      image: "./cars/silverado-front.jpg",
      resultImage: "./cars/silverado-rear.jpg",
      maxSpeed: 170,
      acceleration: 42,
      brake: 72,
      handling: 1.42,
      color: "#eceae1",
    },
    clk55: {
      id: "clk55",
      name: "CLK 55 AMG CABRIOLET",
      className: "GRAND TOURER CLASS",
      image: "./cars/clk55-city.jpg",
      resultImage: "./cars/clk55-rear.jpg",
      maxSpeed: 240,
      acceleration: 56,
      brake: 84,
      handling: 1.18,
      color: "#a86f52",
    },
  };

  const maps = {
    city: {
      id: "city",
      name: "NEON CITY CIRCUIT",
      distance: 2400,
      skyTop: "#071326",
      skyBottom: "#392046",
      ground: "#17151f",
      road: "#24252b",
      roadAlt: "#292a31",
      shoulder: "#ff4c28",
      lane: "#dfe4ef",
      curve: 0.31,
      timeLimit: 64,
      pages: [440, 970, 1510, 2070],
      lanes: [-0.52, 0.38, -0.1, 0.52],
    },
    canyon: {
      id: "canyon",
      name: "RED ROCK EXPEDITION",
      distance: 2800,
      skyTop: "#d5482e",
      skyBottom: "#f5a24b",
      ground: "#54251b",
      road: "#302725",
      roadAlt: "#382c28",
      shoulder: "#f2c451",
      lane: "#fff0c7",
      curve: 0.44,
      timeLimit: 70,
      pages: [510, 1120, 1800, 2470],
      lanes: [0.48, -0.44, 0.1, -0.5],
    },
    forest: {
      id: "forest",
      name: "ALPINE INK RUN",
      distance: 2600,
      skyTop: "#9fb9ae",
      skyBottom: "#e2c995",
      ground: "#172a20",
      road: "#292c2d",
      roadAlt: "#303435",
      shoulder: "#d4ff43",
      lane: "#f3f1df",
      curve: 0.55,
      timeLimit: 72,
      pages: [390, 1050, 1720, 2310],
      lanes: [-0.2, 0.5, -0.48, 0.16],
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
  const ctx = canvas.getContext("2d");
  const countdown = document.getElementById("countdown");
  const pausePanel = document.getElementById("pausePanel");
  const collectToast = document.getElementById("collectToast");
  const howModal = document.getElementById("howModal");
  const gamepadStatus = document.getElementById("gamepadStatus");

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
  };

  const state = {
    screen: "home",
    vehicle: "silverado",
    map: "city",
    sound: true,
    keys: { left: false, right: false, gas: false, brake: false },
    race: null,
    raf: 0,
    gamepadPauseHeld: false,
  };

  let audioContext = null;
  let engineOscillator = null;
  let engineGain = null;

  function showScreen(name) {
    state.screen = name;
    Object.entries(screens).forEach(([key, element]) => element.classList.toggle("active", key === name));
    app.classList.toggle("racing", name === "game");
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
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
  }

  function updateAudio(speed, maxSpeed, active) {
    if (!engineOscillator || !engineGain || !audioContext) return;
    const ratio = Math.max(0, Math.min(1, speed / maxSpeed));
    engineOscillator.frequency.setTargetAtTime(55 + ratio * 115, audioContext.currentTime, 0.05);
    engineGain.gain.setTargetAtTime(state.sound && active ? 0.014 + ratio * 0.026 : 0, audioContext.currentTime, 0.08);
  }

  function formatTime(seconds) {
    const safe = Math.max(0, seconds);
    const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
    const whole = Math.floor(safe % 60).toString().padStart(2, "0");
    const tenth = Math.floor((safe % 1) * 10);
    return `${minutes}:${whole}.${tenth}`;
  }

  function updateBestLabels() {
    document.querySelectorAll("[data-best]").forEach((element) => {
      const value = Number(localStorage.getItem(`tdm-best-${element.dataset.best}`));
      element.textContent = value ? `BEST ${formatTime(value)}` : "BEST —:—";
    });
  }

  function chooseVehicle(id) {
    state.vehicle = id;
    document.querySelectorAll(".vehicle-select-card").forEach((card) => {
      const selected = card.dataset.vehicle === id;
      card.classList.toggle("selected", selected);
      card.querySelector(".selected-mark").textContent = selected ? "SEÇİLDİ" : "SEÇ";
    });
  }

  function chooseMap(id) {
    state.map = id;
    document.querySelectorAll(".map-card").forEach((card) => card.classList.toggle("selected", card.dataset.map === id));
  }

  function bindSelectable(selector, callback, dataKey) {
    document.querySelectorAll(selector).forEach((item) => {
      const select = () => callback(item.dataset[dataKey]);
      item.addEventListener("click", select);
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      });
    });
  }

  bindSelectable(".vehicle-select-card", chooseVehicle, "vehicle");
  bindSelectable(".map-card", chooseMap, "map");
  document.querySelectorAll("[data-screen-target]").forEach((button) => button.addEventListener("click", () => showScreen(button.dataset.screenTarget)));
  document.getElementById("startButton").addEventListener("click", () => showScreen("vehicle"));
  document.getElementById("vehicleContinue").addEventListener("click", () => { updateBestLabels(); showScreen("map"); });
  document.getElementById("raceButton").addEventListener("click", startRace);
  document.getElementById("howButton").addEventListener("click", openHow);
  document.getElementById("howClose").addEventListener("click", closeHow);
  document.getElementById("howStart").addEventListener("click", () => { closeHow(); showScreen("vehicle"); });
  howModal.addEventListener("click", (event) => { if (event.target === howModal) closeHow(); });

  document.getElementById("soundButton").addEventListener("click", (event) => {
    state.sound = !state.sound;
    event.currentTarget.textContent = state.sound ? "SOUND ON" : "SOUND OFF";
    if (state.sound) initAudio();
    if (!state.sound && engineGain && audioContext) engineGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
  });

  function updateGamepadStatus(connected, name = "") {
    gamepadStatus.classList.toggle("connected", connected);
    gamepadStatus.innerHTML = `<i></i>${connected ? `GAMEPAD READY${name ? ` · ${name.slice(0, 16)}` : ""}` : "GAMEPAD BEKLENİYOR"}`;
  }

  window.addEventListener("gamepadconnected", (event) => updateGamepadStatus(true, event.gamepad.id));
  window.addEventListener("gamepaddisconnected", () => updateGamepadStatus(false));

  const keyMap = {
    ArrowLeft: "left", a: "left", A: "left",
    ArrowRight: "right", d: "right", D: "right",
    ArrowUp: "gas", w: "gas", W: "gas",
    ArrowDown: "brake", s: "brake", S: "brake",
  };

  window.addEventListener("keydown", (event) => {
    if (keyMap[event.key]) {
      state.keys[keyMap[event.key]] = true;
      if (state.screen === "game") event.preventDefault();
    }
    if (event.key === "Escape" && state.screen === "game") togglePause();
  });

  window.addEventListener("keyup", (event) => {
    if (keyMap[event.key]) state.keys[keyMap[event.key]] = false;
  });

  document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;
    const set = (value) => {
      state.keys[control] = value;
      button.classList.toggle("active", value);
    };
    button.addEventListener("pointerdown", (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); set(true); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => button.addEventListener(name, () => set(false)));
  });

  function readControls() {
    let steer = (state.keys.right ? 1 : 0) - (state.keys.left ? 1 : 0);
    let gas = state.keys.gas ? 1 : 0;
    let brake = state.keys.brake ? 1 : 0;
    const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    const pad = pads[0];
    if (pad) {
      const axis = Math.abs(pad.axes[0] || 0) > 0.12 ? pad.axes[0] : 0;
      steer = Math.abs(axis) > Math.abs(steer) ? axis : steer;
      gas = Math.max(gas, pad.buttons[7]?.value || (pad.buttons[0]?.pressed ? 1 : 0));
      brake = Math.max(brake, pad.buttons[6]?.value || (pad.buttons[1]?.pressed ? 1 : 0));
      const pausePressed = Boolean(pad.buttons[9]?.pressed);
      if (pausePressed && !state.gamepadPauseHeld && state.screen === "game") togglePause();
      state.gamepadPauseHeld = pausePressed;
    }
    return { steer, gas, brake };
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: rect.width, height: rect.height };
  }

  function startRace() {
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
      maxSpeed: 0,
      pages: new Set(),
      lastTime: performance.now(),
      vehicle,
      map,
    };
    hud.vehicleImage.src = vehicle.image;
    hud.vehicle.textContent = vehicle.name;
    hud.vehicleClass.textContent = vehicle.className;
    hud.map.textContent = map.name;
    hud.pages.innerHTML = Array.from({ length: 4 }, (_, index) => `<i class="page-pip" data-pip="${index}"></i>`).join("");
    updateHud();
    showScreen("game");
    pausePanel.classList.remove("show");
    cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(gameFrame);
    runCountdown();
  }

  function runCountdown() {
    let number = 3;
    const show = (value) => {
      countdown.textContent = value;
      countdown.classList.remove("show");
      void countdown.offsetWidth;
      countdown.classList.add("show");
    };
    show(number);
    const timer = setInterval(() => {
      if (!state.race || state.screen !== "game") { clearInterval(timer); return; }
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
    updateAudio(race.speed, race.vehicle.maxSpeed, !race.paused);
  }

  document.getElementById("pauseButton").addEventListener("click", togglePause);
  document.getElementById("resumeButton").addEventListener("click", togglePause);
  document.getElementById("quitButton").addEventListener("click", () => quitRace("map"));
  document.getElementById("replayButton").addEventListener("click", startRace);
  document.getElementById("newRouteButton").addEventListener("click", () => { updateBestLabels(); showScreen("map"); });

  function quitRace(target) {
    if (state.race) state.race.active = false;
    cancelAnimationFrame(state.raf);
    updateAudio(0, 1, false);
    pausePanel.classList.remove("show");
    showScreen(target);
  }

  function updateRace(dt) {
    const race = state.race;
    const input = readControls();
    const v = race.vehicle;
    if (input.gas > 0) race.speed += v.acceleration * input.gas * dt;
    else race.speed -= 16 * dt;
    if (input.brake > 0) race.speed -= v.brake * input.brake * dt;

    const steerStrength = v.handling * (0.62 + race.speed / v.maxSpeed);
    race.playerX += input.steer * steerStrength * dt;
    race.playerX *= Math.pow(0.991, dt * 60);
    if (Math.abs(race.playerX) > 0.88) race.speed -= 54 * dt;
    race.playerX = Math.max(-1.18, Math.min(1.18, race.playerX));
    race.speed = Math.max(0, Math.min(v.maxSpeed, race.speed));
    race.maxSpeed = Math.max(race.maxSpeed, race.speed);
    race.distance += race.speed * dt * 0.36;
    race.elapsed += dt;

    race.map.pages.forEach((position, index) => {
      if (race.pages.has(index)) return;
      const delta = position - race.distance;
      if (delta < 34 && delta > -14 && Math.abs(race.playerX - race.map.lanes[index]) < 0.33) collectPage(index);
    });

    if (race.distance >= race.map.distance || race.elapsed >= race.map.timeLimit) finishRace();
    updateAudio(race.speed, v.maxSpeed, true);
    updateHud();
  }

  function collectPage(index) {
    const race = state.race;
    race.pages.add(index);
    const pip = hud.pages.querySelector(`[data-pip="${index}"]`);
    if (pip) pip.classList.add("on");
    collectToast.classList.remove("show");
    void collectToast.offsetWidth;
    collectToast.classList.add("show");
    setTimeout(() => collectToast.classList.remove("show"), 1200);
  }

  function updateHud() {
    const race = state.race;
    if (!race) return;
    const progress = Math.min(100, (race.distance / race.map.distance) * 100);
    hud.progress.style.width = `${progress}%`;
    hud.distance.textContent = `${(race.distance / 1000).toFixed(1)} / ${(race.map.distance / 1000).toFixed(1)} KM`;
    hud.time.textContent = formatTime(race.elapsed);
    hud.pageCounter.textContent = `${race.pages.size} / 4`;
    hud.speed.textContent = Math.round(race.speed).toString().padStart(3, "0");
    hud.speedBar.style.width = `${Math.min(100, (race.speed / race.vehicle.maxSpeed) * 100)}%`;
    hud.gear.textContent = race.speed < 3 ? "N" : Math.min(6, Math.max(1, Math.ceil(race.speed / 38))).toString();
  }

  function finishRace() {
    const race = state.race;
    if (!race || race.finished) return;
    race.finished = true;
    race.active = false;
    updateAudio(0, race.vehicle.maxSpeed, false);
    const bestKey = `tdm-best-${race.map.id}`;
    const previousBest = Number(localStorage.getItem(bestKey));
    if (!previousBest || race.elapsed < previousBest) localStorage.setItem(bestKey, race.elapsed.toFixed(2));

    const pages = race.pages.size;
    const finishedDistance = race.distance >= race.map.distance;
    const grade = !finishedDistance ? "C" : pages === 4 ? "S" : pages >= 3 ? "A" : pages >= 2 ? "B" : "C";
    document.getElementById("resultImage").src = race.vehicle.resultImage;
    document.getElementById("resultGrade").textContent = grade;
    document.getElementById("resultTime").textContent = formatTime(race.elapsed);
    document.getElementById("resultPages").textContent = `${pages} / 4`;
    document.getElementById("resultSpeed").textContent = `${Math.round(race.maxSpeed)} KM/H`;
    document.getElementById("resultMessage").textContent = finishedDistance
      ? pages === 4 ? "Tüm kayıp çizimler bulundu. Bu rota koleksiyona başarıyla işlendi." : `${4 - pages} çizim sayfası yolda kaldı. Rotayı tekrar sürerek koleksiyonu tamamlayabilirsin.`
      : "Süre doldu. Daha temiz çizgiler ve daha yüksek ortalama hızla tekrar dene.";
    setTimeout(() => showScreen("result"), 500);
  }

  function gameFrame(time) {
    const race = state.race;
    if (!race || state.screen !== "game") return;
    const dt = Math.min(0.034, Math.max(0, (time - race.lastTime) / 1000));
    race.lastTime = time;
    if (race.active && !race.paused && !race.finished) updateRace(dt);
    else readControls();
    drawGame(time / 1000);
    state.raf = requestAnimationFrame(gameFrame);
  }

  function roadCenter(t, width, race) {
    const wave = Math.sin(race.distance * 0.0019 + (1 - t) * 3.25) + Math.sin(race.distance * 0.00073 + (1 - t) * 1.4) * 0.4;
    return width / 2 + wave * race.map.curve * width * (1 - t) * 0.27;
  }

  function projectRoadObject(distance, lane, width, height, race) {
    const delta = distance - race.distance;
    if (delta < -20 || delta > 930) return null;
    const t = 1 - Math.max(0, delta) / 930;
    const horizon = height * 0.31;
    const y = horizon + Math.pow(t, 1.75) * (height - horizon);
    const half = width * (0.065 + Math.pow(t, 1.35) * 0.44);
    const center = roadCenter(t, width, race);
    return { x: center + lane * half * 0.74, y, t, size: 10 + Math.pow(t, 1.7) * 88 };
  }

  function drawSky(width, height, map, race, time) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.72);
    gradient.addColorStop(0, map.skyTop);
    gradient.addColorStop(1, map.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (map.id === "city") {
      ctx.fillStyle = "rgba(236,240,255,.85)";
      ctx.beginPath(); ctx.arc(width * 0.79, height * 0.14, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0e1320";
      for (let i = 0; i < 18; i += 1) {
        const bw = width / 18 + 2;
        const bh = 28 + ((i * 47) % 105);
        const x = i * width / 18;
        const y = height * 0.31 - bh;
        ctx.fillRect(x, y, bw, bh);
        ctx.fillStyle = i % 3 === 0 ? "rgba(255,76,40,.55)" : "rgba(130,169,255,.28)";
        for (let wy = y + 9; wy < y + bh - 5; wy += 13) for (let wx = x + 7; wx < x + bw - 5; wx += 11) ctx.fillRect(wx, wy, 2, 3);
        ctx.fillStyle = "#0e1320";
      }
    } else if (map.id === "canyon") {
      ctx.fillStyle = "rgba(255,211,95,.83)";
      ctx.beginPath(); ctx.arc(width * 0.76, height * 0.16, 38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#6c2c20";
      ctx.beginPath(); ctx.moveTo(0, height * 0.33); ctx.lineTo(width * .14, height * .18); ctx.lineTo(width * .27, height * .32); ctx.lineTo(width * .4, height * .15); ctx.lineTo(width * .55, height * .33); ctx.lineTo(width * .72, height * .21); ctx.lineTo(width, height * .35); ctx.lineTo(width, height * .48); ctx.lineTo(0, height * .48); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = "rgba(251,226,163,.75)";
      ctx.beginPath(); ctx.arc(width * 0.73, height * 0.17, 31, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#365746";
      for (let i = 0; i < 28; i += 1) {
        const x = i * width / 27;
        const base = height * .38;
        const pine = 30 + (i * 31 % 70);
        ctx.beginPath(); ctx.moveTo(x, base - pine); ctx.lineTo(x - pine * .24, base); ctx.lineTo(x + pine * .24, base); ctx.closePath(); ctx.fill();
      }
    }

    ctx.fillStyle = map.ground;
    ctx.fillRect(0, height * 0.31, width, height * 0.69);
    const pulse = 0.4 + Math.sin(time * 2) * 0.05;
    ctx.fillStyle = `rgba(255,255,255,${pulse * .04})`;
    ctx.fillRect(0, height * .3, width, 2);
  }

  function drawRoad(width, height, race) {
    const horizon = height * 0.31;
    const segments = 62;
    const phase = Math.floor(race.distance / 24);
    for (let i = 0; i < segments; i += 1) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      const y0 = horizon + Math.pow(t0, 1.72) * (height - horizon);
      const y1 = horizon + Math.pow(t1, 1.72) * (height - horizon);
      const half0 = width * (.065 + Math.pow(t0, 1.25) * .44);
      const half1 = width * (.065 + Math.pow(t1, 1.25) * .44);
      const center0 = roadCenter(t0, width, race);
      const center1 = roadCenter(t1, width, race);
      const shoulder0 = 4 + t0 * 17;
      const shoulder1 = 4 + t1 * 17;

      ctx.fillStyle = race.map.shoulder;
      quad(center0 - half0 - shoulder0, y0, center0 + half0 + shoulder0, y0, center1 + half1 + shoulder1, y1, center1 - half1 - shoulder1, y1);
      ctx.fillStyle = (i + phase) % 2 ? race.map.road : race.map.roadAlt;
      quad(center0 - half0, y0, center0 + half0, y0, center1 + half1, y1, center1 - half1, y1);

      if ((i + phase) % 7 < 3 && i > 4) {
        ctx.fillStyle = race.map.lane;
        [-1 / 3, 1 / 3].forEach((lane) => {
          const mark0 = 1 + t0 * 2.5;
          const mark1 = 1 + t1 * 2.5;
          const lx0 = center0 + lane * half0;
          const lx1 = center1 + lane * half1;
          quad(lx0 - mark0, y0, lx0 + mark0, y0, lx1 + mark1, y1, lx1 - mark1, y1);
        });
      }
    }
  }

  function quad(x1, y1, x2, y2, x3, y3, x4, y4) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill();
  }

  function drawScenery(width, height, race) {
    const objects = [];
    for (let i = 0; i < 18; i += 1) {
      const spacing = 170;
      const loop = 2100;
      const distance = ((i * spacing - race.distance) % loop + loop) % loop;
      if (distance > 920) continue;
      const t = 1 - distance / 920;
      objects.push({ t, side: i % 2 ? 1 : -1, seed: i });
    }
    objects.sort((a, b) => a.t - b.t).forEach((object) => {
      const t = object.t;
      const y = height * .31 + Math.pow(t, 1.75) * (height - height * .31);
      const half = width * (.065 + Math.pow(t, 1.35) * .44);
      const center = roadCenter(t, width, race);
      const size = 8 + Math.pow(t, 1.65) * 72;
      const x = center + object.side * (half + size * .8 + 8);
      if (race.map.id === "city") drawBuilding(x, y, size, object.seed);
      else if (race.map.id === "canyon") drawRock(x, y, size, object.seed);
      else drawPine(x, y, size, object.seed);
    });
  }

  function drawBuilding(x, y, size, seed) {
    ctx.fillStyle = seed % 3 ? "#131824" : "#252039";
    ctx.fillRect(x - size * .35, y - size * 1.4, size * .7, size * 1.4);
    ctx.fillStyle = seed % 2 ? "#ff5b3c" : "#769cff";
    for (let row = 0; row < 4; row += 1) for (let col = 0; col < 2; col += 1) ctx.fillRect(x - size * .23 + col * size * .25, y - size * 1.18 + row * size * .26, Math.max(1, size * .08), Math.max(1, size * .06));
  }

  function drawRock(x, y, size, seed) {
    ctx.fillStyle = seed % 2 ? "#783421" : "#5d281f";
    ctx.beginPath(); ctx.moveTo(x - size * .55, y); ctx.lineTo(x - size * .38, y - size * .54); ctx.lineTo(x - size * .08, y - size * .8); ctx.lineTo(x + size * .38, y - size * .42); ctx.lineTo(x + size * .52, y); ctx.closePath(); ctx.fill();
  }

  function drawPine(x, y, size, seed) {
    ctx.fillStyle = seed % 2 ? "#183d2c" : "#214e37";
    for (let level = 0; level < 3; level += 1) {
      const top = y - size * (1.5 - level * .37);
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x - size * (.5 - level * .04), y - size * (.56 - level * .18)); ctx.lineTo(x + size * (.5 - level * .04), y - size * (.56 - level * .18)); ctx.closePath(); ctx.fill();
    }
  }

  function drawCollectibles(width, height, race, time) {
    race.map.pages.forEach((distance, index) => {
      if (race.pages.has(index)) return;
      const projected = projectRoadObject(distance, race.map.lanes[index], width, height, race);
      if (!projected) return;
      ctx.save();
      ctx.translate(projected.x, projected.y - projected.size * .55);
      ctx.rotate(Math.sin(time * 2.4 + index) * .18);
      const s = projected.size;
      ctx.shadowColor = "#d4ff43"; ctx.shadowBlur = 16 * projected.t;
      ctx.fillStyle = "#f4f0e7"; ctx.fillRect(-s * .3, -s * .4, s * .6, s * .8);
      ctx.shadowBlur = 0; ctx.strokeStyle = "#151515"; ctx.lineWidth = Math.max(1, s * .025); ctx.strokeRect(-s * .3, -s * .4, s * .6, s * .8);
      ctx.fillStyle = "#ff4c28"; ctx.fillRect(-s * .22, -s * .3, s * .44, s * .08);
      ctx.fillStyle = "#181818"; ctx.font = `${Math.max(5, s * .14)}px ${getComputedStyle(document.body).fontFamily}`; ctx.textAlign = "center"; ctx.fillText("TDM", 0, s * .08);
      ctx.restore();
    });
  }

  function drawPlayer(width, height, race) {
    const nearHalf = width * .48;
    const x = width / 2 + race.playerX * nearHalf * .72;
    const y = height * .82;
    const scale = Math.max(.68, Math.min(1.15, width / 1100));
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 22; ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.beginPath(); ctx.ellipse(0, 33, 56, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    if (race.vehicle.id === "silverado") drawSilverado(); else drawClk();
    ctx.restore();
  }

  function drawSilverado() {
    ctx.fillStyle = "#0c0d0f"; ctx.fillRect(-58, -8, 13, 55); ctx.fillRect(45, -8, 13, 55);
    ctx.fillStyle = "#eeece5"; roundRect(-51, -48, 102, 92, 15); ctx.fill();
    ctx.fillStyle = "#17191d"; roundRect(-43, -40, 86, 34, 9); ctx.fill();
    ctx.fillStyle = "#23262b"; ctx.fillRect(-50, 5, 100, 20);
    ctx.strokeStyle = "#6f7479"; ctx.lineWidth = 3; ctx.strokeRect(-41, -58, 82, 14); ctx.beginPath(); ctx.moveTo(-31,-58);ctx.lineTo(-31,-44);ctx.moveTo(31,-58);ctx.lineTo(31,-44);ctx.stroke();
    ctx.fillStyle = "#ff3f27"; roundRect(-43, 28, 24, 9, 3); ctx.fill(); roundRect(19, 28, 24, 9, 3); ctx.fill();
    ctx.strokeStyle = "#26282b"; ctx.lineWidth = 1.5; for (let i = -2; i <= 2; i += 1) { ctx.beginPath(); ctx.moveTo(-30, i * 10 + 2); ctx.bezierCurveTo(-12, i * 10 - 5, 10, i * 10 + 8, 31, i * 10); ctx.stroke(); }
    ctx.fillStyle = "#181a1c"; ctx.fillRect(-24, 40, 48, 5);
  }

  function drawClk() {
    ctx.fillStyle = "#0b0c0d"; ctx.fillRect(-49, -2, 11, 48); ctx.fillRect(38, -2, 11, 48);
    ctx.fillStyle = "#a66c50"; roundRect(-45, -45, 90, 84, 21); ctx.fill();
    ctx.fillStyle = "#17191d"; roundRect(-37, -34, 74, 27, 12); ctx.fill();
    ctx.fillStyle = "#d2c1a3"; ctx.beginPath(); ctx.arc(-18, -18, 8, 0, Math.PI * 2); ctx.arc(18, -18, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#e2d5bd"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-37,-34);ctx.lineTo(37,-34);ctx.stroke();
    ctx.fillStyle = "#c42b2c"; roundRect(-37, 20, 25, 11, 4); ctx.fill(); roundRect(12, 20, 25, 11, 4); ctx.fill();
    ctx.fillStyle = "#d7c5ab"; ctx.fillRect(-6, 18, 12, 9);
    ctx.fillStyle = "#17191d"; ctx.fillRect(-25, 36, 50, 5);
  }

  function roundRect(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r); ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r); ctx.arcTo(x, y, x + width, y, r); ctx.closePath();
  }

  function drawGame(time) {
    const race = state.race;
    if (!race) return;
    const { width, height } = resizeCanvas();
    ctx.clearRect(0, 0, width, height);
    drawSky(width, height, race.map, race, time);
    drawRoad(width, height, race);
    drawScenery(width, height, race);
    drawCollectibles(width, height, race, time);
    drawPlayer(width, height, race);
    if (Math.abs(race.playerX) > .88) {
      ctx.fillStyle = `rgba(255,76,40,${Math.min(.18, (Math.abs(race.playerX)-.88)*.45)})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  updateBestLabels();
  chooseVehicle("silverado");
  chooseMap("city");
})();
