// =========================
//  CONSTANTS & STATE
// =========================

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// If you later want to switch modes dynamically, change this back to `let`.
const secondsMode = "highFreq"; // "smooth" | "tick1" | "tick2" | "highFreq"

let rafId = null;
let secondsAngle = 0;
let lastHourDeg = null;
let lastMinuteDeg = null;
let lastSecondsAngle = null;
let transitionsCleared = false;

// DOM references (filled on DOMContentLoaded)
let hourMarksContainer;
let accentMarksContainer;
let sweepRotator;
let clockFace;
let hourHand;
let minuteHand;
let secondHandContainer;
let secondHandShadow;
let dateDisplay;
let timezoneDisplay;

// =========================
//  INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  hourMarksContainer   = document.getElementById("clock-hour-marks");
  accentMarksContainer = document.getElementById("clock-hour-marks-accent");
  sweepRotator         = document.getElementById("sweep-rotator");
  clockFace            = document.querySelector(".glass-clock-face");
  hourHand             = document.getElementById("hour-hand");
  minuteHand           = document.getElementById("minute-hand");
  secondHandContainer  = document.getElementById("second-hand-container");
  secondHandShadow     = document.getElementById("second-hand-shadow");
  dateDisplay          = document.getElementById("clock-date");
  timezoneDisplay      = document.getElementById("clock-timezone");

  initDarkMode();
  buildDialMarks();
  startClock();

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // iOS Safari only applies :active styles on tap when a touch listener
  // is registered on the element (otherwise it treats it as non-interactive).
  if (clockFace) {
    clockFace.addEventListener("touchstart", () => {}, { passive: true });
  }
});

// =========================
//  CLOCK FACE / GLASS
// =========================
function buildDialMarks() {
  if (!hourMarksContainer) return;

  // Positions are percentages of the clock face, so the dial scales with it
  // (no resize handling needed). Radius: 41.4% of diameter (145/350).
  const radius = 41.4;

  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) {
      const hourIndex = i / 5;
      const numberEl  = document.createElement("div");
      numberEl.className = "clock-number";

      const angleRad = (i * 6 * Math.PI) / 180;

      numberEl.style.left = `${50 + Math.sin(angleRad) * radius}%`;
      numberEl.style.top  = `${50 - Math.cos(angleRad) * radius}%`;

      // Numbers counterclockwise: 12, 11, ..., 1
      numberEl.textContent = hourIndex === 0 ? "12" : (12 - hourIndex).toString();

      hourMarksContainer.appendChild(numberEl);

      if (accentMarksContainer) {
        accentMarksContainer.appendChild(numberEl.cloneNode(true));
      }
    } else {
      const marker = document.createElement("div");
      marker.className = "minute-marker";
      marker.style.transform = `rotate(${i * 6}deg)`;
      hourMarksContainer.appendChild(marker);
    }
  }
}

// =========================
//  CLOCK LOGIC (shared RAF)
// =========================
function startClock() {
  if (!hourHand || !minuteHand || !secondHandContainer) return;
  if (rafId != null) return;

  ensureTransitionsOff();
  // Snap immediately so resume-from-hidden doesn't wait a frame.
  updateClock(true);
  rafId = requestAnimationFrame(clockFrame);
}

function stopClock() {
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopClock();
  } else {
    // Force a write on resume even if angles match cached values.
    lastHourDeg = null;
    lastMinuteDeg = null;
    lastSecondsAngle = null;
    startClock();
  }
}

function clockFrame() {
  rafId = null;
  if (document.hidden) return;

  updateClock(false);
  rafId = requestAnimationFrame(clockFrame);
}

function ensureTransitionsOff() {
  if (transitionsCleared) return;
  if (secondHandContainer) secondHandContainer.style.transition = "none";
  if (secondHandShadow) secondHandShadow.style.transition = "none";
  transitionsCleared = true;
}

function ticksPerSecondForMode() {
  switch (secondsMode) {
    case "tick1":    return 1;
    case "tick2":    return 2;
    case "highFreq": return 10;
    case "smooth":
    default:         return 0; // continuous
  }
}

function computeSecondsAngle(seconds, milliseconds) {
  const ticksPerSecond = ticksPerSecondForMode();

  if (ticksPerSecond === 0) {
    // Smooth: 6° per second + fractional ms
    return -(seconds * 6 + (milliseconds / 1000) * 6);
  }

  const intervalMs           = 1000 / ticksPerSecond;
  const timeInMs             = seconds * 1000 + milliseconds;
  const tickIndex            = Math.floor(timeInMs / intervalMs);
  const totalTicksInRotation = ticksPerSecond * 60;
  const currentTick          = tickIndex % totalTicksInRotation;

  return -(currentTick * (360 / totalTicksInRotation));
}

function updateSweepMask() {
  if (!sweepRotator || !accentMarksContainer) return;
  sweepRotator.style.transform         = `rotate(${secondsAngle}deg)`;
  accentMarksContainer.style.transform = `rotate(${-secondsAngle}deg)`;
}

function updateClock(force) {
  const now          = new Date();
  const hours        = now.getHours() % 12;
  const minutes      = now.getMinutes();
  const seconds      = now.getSeconds();
  const milliseconds = now.getMilliseconds();

  const hoursDegrees = -(
    hours * 30 +
    (minutes / 60) * 30 +
    (seconds / 3600) * 30
  );
  const minutesDegrees = -(
    minutes * 6 +
    (seconds / 60) * 6
  );

  secondsAngle = computeSecondsAngle(seconds, milliseconds);

  if (force || hoursDegrees !== lastHourDeg) {
    hourHand.style.transform = `rotate(${hoursDegrees}deg)`;
    lastHourDeg = hoursDegrees;
  }

  if (force || minutesDegrees !== lastMinuteDeg) {
    minuteHand.style.transform = `rotate(${minutesDegrees}deg)`;
    lastMinuteDeg = minutesDegrees;
  }

  if (force || secondsAngle !== lastSecondsAngle) {
    secondHandContainer.style.transform = `rotate(${secondsAngle}deg)`;

    if (secondHandShadow) {
      secondHandShadow.style.transform = `rotate(${secondsAngle - 0.5}deg)`;
    }

    updateSweepMask();
    lastSecondsAngle = secondsAngle;
  }

  // Date: only set once
  if (dateDisplay && !dateDisplay.textContent) {
    dateDisplay.textContent = `${DAYS[now.getDay()]} ${now.getDate()}`;
  }

  // Timezone: only set once
  if (timezoneDisplay && !timezoneDisplay.hasAttribute("data-initialized")) {
    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const city   = tzName.split("/").pop().replace(/_/g, " ");
    timezoneDisplay.textContent = city;
    timezoneDisplay.setAttribute("data-initialized", "true");
  }
}

// =========================
//  DARK MODE
// =========================
function initDarkMode() {
  const toggle = document.getElementById("dark-mode-toggle");
  const saved  = localStorage.getItem("theme");

  if (saved === "dark") {
    document.body.classList.add("dark-mode");
  }

  if (toggle) {
    toggle.addEventListener("click", handleDarkModeToggle);
  }
}

function handleDarkModeToggle() {
  document.body.classList.toggle("dark-mode");
  const theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", theme);
}
