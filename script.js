// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
  buildClockFace();
  setClockStyles();
  startClock();
});

/* -------------------------------------------------------------------------- */
/* 🕒 CLOCK FACE CREATION */
/* -------------------------------------------------------------------------- */
function buildClockFace() {
  const hourMarksContainer = document.getElementById("clock-hour-marks");
  if (!hourMarksContainer) return;

  const clockFace = document.querySelector(".glass-clock-face");
  const clockSize = clockFace?.offsetWidth || 350;
  const center = clockSize / 2;
  const radius = clockSize * 0.414;

  const frag = document.createDocumentFragment();

  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) {
      const hourNumber = document.createElement("div");
      hourNumber.className = "clock-number";

      const angle = (i * 6 * Math.PI) / 180;
      const left = center + Math.sin(angle) * radius - 12;
      const top = center - Math.cos(angle) * radius - 9;

      hourNumber.style.left = `${left}px`;
      hourNumber.style.top = `${top}px`;

      const hourIndex = i / 5;
      hourNumber.textContent = hourIndex === 0 ? "12" : (12 - hourIndex).toString();

      frag.appendChild(hourNumber);
    } else {
      const minuteMarker = document.createElement("div");
      minuteMarker.className = "minute-marker";
      minuteMarker.style.transform = `rotate(${i * 6}deg)`;
      frag.appendChild(minuteMarker);
    }
  }

  hourMarksContainer.appendChild(frag);
}

/* -------------------------------------------------------------------------- */
/* 💡 FIXED LIGHTING & OVERLAYS */
/* -------------------------------------------------------------------------- */
function setClockStyles() {
  const root = document.documentElement;
  root.style.setProperty("--primary-light-angle", "-45deg");
  root.style.setProperty("--dark-edge-angle", "135deg");
  root.style.setProperty("--inner-shadow-opacity", "0.15");
  root.style.setProperty("--reflection-opacity", "0.5");
  root.style.setProperty("--glossy-opacity", "0.3");

  const glossyOverlay = document.getElementById("glass-glossy-overlay");
  if (glossyOverlay) {
    glossyOverlay.style.cssText = `
      background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.9) 0%, 
        rgba(255, 255, 255, 0.1) 100%);
      filter: blur(10px);
    `;
  }

  const reflectionOverlay = document.getElementById("glass-reflection-overlay");
  if (reflectionOverlay) {
    reflectionOverlay.style.cssText = `
      transform: rotate(-15deg);
      filter: blur(10px);
    `;
  }
}

/* -------------------------------------------------------------------------- */
/* ⏱ CLOCK ANIMATION */
/* -------------------------------------------------------------------------- */
let secondsMode = "smooth";
let animationFrameId;

function startClock() {
  const hourHand = document.getElementById("hour-hand");
  const minuteHand = document.getElementById("minute-hand");
  const secondHandContainer = document.getElementById("second-hand-container");
  const secondHandShadow = document.getElementById("second-hand-shadow");

  if (!hourHand || !minuteHand || !secondHandContainer) return;

  // Start hands animation
  updateHands(hourHand, minuteHand);
  animateSeconds(secondHandContainer, secondHandShadow);
}

function updateHands(hourHand, minuteHand) {
  function loop() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;

    const hoursDeg = -(hours * 30 + minutes / 2 + seconds / 120);
    const minutesDeg = -(minutes * 6 + seconds * 0.1);

    hourHand.style.transform = `rotate(${hoursDeg}deg)`;
    minuteHand.style.transform = `rotate(${minutesDeg}deg)`;

    // Once-only UI updates
    updateDateAndTimezone(now);

    animationFrameId = requestAnimationFrame(loop);
  }
  loop();
}

function animateSeconds(secondHandContainer, secondHandShadow) {
  cancelAnimationFrame(animationFrameId);

  const tickModes = {
    tick1: { deg: 6, rate: 1 },
    tick2: { deg: 3, rate: 2 },
    highFreq: { deg: 0.75, rate: 8 },
  };

  const mode = tickModes[secondsMode];
  if (!mode && secondsMode === "smooth") {
    animateSmooth(secondHandContainer, secondHandShadow);
  } else {
    animateTick(secondHandContainer, secondHandShadow, mode.deg, mode.rate);
  }
}

function animateSmooth(secondHandContainer, secondHandShadow) {
  secondHandContainer.style.willChange = "transform";
  secondHandShadow?.style.willChange = "transform";

  function loop() {
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const angle = -(seconds * 6);

    secondHandContainer.style.transform = `rotate(${angle}deg) translateZ(0)`;
    if (secondHandShadow) {
      secondHandShadow.style.transform = `rotate(${angle - 0.5}deg) translateZ(0)`;
    }

    animationFrameId = requestAnimationFrame(loop);
  }
  loop();
}

function animateTick(secondHandContainer, secondHandShadow, degPerTick, ticksPerSec) {
  const totalTicks = ticksPerSec * 60;
  const interval = 1000 / ticksPerSec;
  let lastTick = -1;

  function loop() {
    const now = new Date();
    const t = now.getSeconds() * 1000 + now.getMilliseconds();
    const tick = Math.floor(t / interval);

    if (tick !== lastTick) {
      lastTick = tick;
      const angle = -((tick % totalTicks) * (360 / totalTicks));
      secondHandContainer.style.transition = "none";
      secondHandContainer.style.transform = `rotate(${angle}deg)`;
      if (secondHandShadow)
        secondHandShadow.style.transform = `rotate(${angle - 0.5}deg)`;
    }

    requestAnimationFrame(loop);
  }
  loop();
}

/* -------------------------------------------------------------------------- */
/* 📅 DATE & TIMEZONE */
/* -------------------------------------------------------------------------- */
function updateDateAndTimezone(now) {
  const dateDisplay = document.getElementById("clock-date");
  const timezoneDisplay = document.getElementById("clock-timezone");

  if (dateDisplay && !dateDisplay.textContent) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    dateDisplay.textContent = `${months[now.getMonth()]} ${now.getDate()}`;
  }

  if (timezoneDisplay && !timezoneDisplay.hasAttribute("data-initialized")) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const city = tz.split("/").pop().replace(/_/g, " ");
    timezoneDisplay.textContent = city;
    timezoneDisplay.dataset.initialized = "true";
  }
}

/* -------------------------------------------------------------------------- */
/* 🌙 DARK MODE */
/* -------------------------------------------------------------------------- */
function initDarkMode() {
  const toggle = document.getElementById("dark-mode-toggle");
  const saved = localStorage.getItem("theme");

  if (saved === "dark") document.body.classList.add("dark-mode");

  toggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark-mode") ? "dark" : "light"
    );
  });
}
