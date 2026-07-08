// =========================
//  CONSTANTS & STATE
// =========================

// Used for the date label (optimization #1: hoisted from inside the function)
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

let secondsAngle = 0;
let secondsAnimationFrameId = null;

// Optimization #3: secondsMode is const because we never reassign it
// If you later want to switch modes dynamically, change this back to `let`.
const secondsMode = "highFreq"; // "smooth" | "tick1" | "tick2" | "highFreq"

// DOM references (filled on DOMContentLoaded)
let hourMarksContainer;
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
  // Cache DOM references
  hourMarksContainer   = document.getElementById("clock-hour-marks");
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
});

// =========================
//  CLOCK FACE / GLASS
// =========================
function buildDialMarks() {
  if (!hourMarksContainer) return;

  const size   = clockFace ? clockFace.offsetWidth : 350;
  const center = size / 2;
  const radius = size * 0.414; // same proportion as original (145/350)

  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) {
      // Hour numbers
      const hourIndex = i / 5;
      const numberEl  = document.createElement("div");
      numberEl.className = "clock-number";

      const angleRad = (i * 6 * Math.PI) / 180;
      const left = center + Math.sin(angleRad) * radius - 12;
      const top  = center - Math.cos(angleRad) * radius - 9;

      numberEl.style.left = `${left}px`;
      numberEl.style.top  = `${top}px`;

      // Numbers counterclockwise: 12, 11, ..., 1
      numberEl.textContent = hourIndex === 0 ? "12" : (12 - hourIndex).toString();

      hourMarksContainer.appendChild(numberEl);
    } else {
      // Minute markers
      const marker = document.createElement("div");
      marker.className = "minute-marker";
      marker.style.transform = `rotate(${i * 6}deg)`;
      hourMarksContainer.appendChild(marker);
    }
  }
}


// =========================
//  CLOCK LOGIC
// =========================
function startClock() {
  // Optimization #4: defensive check – doesn't affect your page, but prevents errors
  if (!hourHand || !minuteHand || !secondHandContainer) {
    // Required elements missing — do nothing
    return;
  }

  // Start hour + minute hands (smooth, real-time)
  updateHourAndMinuteHands();
  // Start seconds hand animation (mode-dependent)
  animateSecondHand();
}

// Hour + minute: smooth reverse (counterclockwise) motion
function updateHourAndMinuteHands() {
  const now      = new Date();
  const hours    = now.getHours() % 12;
  const minutes  = now.getMinutes();
  const seconds  = now.getSeconds();

  if (hourHand && minuteHand) {
    // identical math to your original version
    const hoursDegrees = -(
      hours * 30 +
      (minutes / 60) * 30 +
      (seconds / 3600) * 30
    );
    const minutesDegrees = -(
      minutes * 6 +
      (seconds / 60) * 6
    );

    hourHand.style.transform   = `rotate(${hoursDegrees}deg)`;
    minuteHand.style.transform = `rotate(${minutesDegrees}deg)`;
  }

  // Date: only set once (now using DAYS constant, optimization #1)
  if (dateDisplay && !dateDisplay.textContent) {
    dateDisplay.textContent =
      `${DAYS[now.getDay()]} ${now.getDate()}`;
  }

  // Timezone: only set once
  if (timezoneDisplay && !timezoneDisplay.hasAttribute("data-initialized")) {
    const tzName  = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const city    = tzName.split("/").pop().replace(/_/g, " ");
    timezoneDisplay.textContent = city;
    timezoneDisplay.setAttribute("data-initialized", "true");
  }

  // Keep updating smoothly
  requestAnimationFrame(updateHourAndMinuteHands);
}

// =========================
//  SECONDS HAND
// =========================
function animateSecondHand() {
  // Cancel only the smooth-mode RAF loop, if any
  if (secondsAnimationFrameId != null) {
    cancelAnimationFrame(secondsAnimationFrameId);
    secondsAnimationFrameId = null;
  }

  if (!secondHandContainer) return;

  switch (secondsMode) {
    case "tick1":   // tick per second
      animateTickMode(1); // optimization #2: only ticksPerSecond
      break;
    case "tick2":   // 2 ticks per second
      animateTickMode(2);
      break;
    case "highFreq": // 10 ticks per second (5Hz balance, i.e. 36,000 vph)
      animateTickMode(10);
      break;
    case "smooth":
    default:
      animateSmoothMode();
      break;
  }
}

// Optimization #2: animateTickMode now only takes ticksPerSecond
function animateTickMode(ticksPerSecond) {
  let lastTickTime = 0;
  const intervalMs = 1000 / ticksPerSecond;

  function tick() {
    const now          = new Date();
    const seconds      = now.getSeconds();
    const milliseconds = now.getMilliseconds();
    const timeInMs     = seconds * 1000 + milliseconds;

    const tickIndex       = Math.floor(timeInMs / intervalMs);
    const currentTickTime = tickIndex * intervalMs;

    if (currentTickTime !== lastTickTime) {
      lastTickTime = currentTickTime;

      const totalTicksInRotation = ticksPerSecond * 60;
      const currentTick          = tickIndex % totalTicksInRotation;

      // Reverse (counterclockwise) angle, identical to original
      secondsAngle = -(currentTick * (360 / totalTicksInRotation));

      secondHandContainer.style.transition = "none";
      secondHandContainer.style.transform  = `rotate(${secondsAngle}deg)`;

      if (secondHandShadow) {
        secondHandShadow.style.transition = "none";
        secondHandShadow.style.transform  = `rotate(${secondsAngle - 0.5}deg)`;
      }
    }

    // same logic: poll frequently to catch ticks
    setTimeout(tick, 10);
  }

  tick();
}

// Smooth animation (RAF loop)
function animateSmoothMode() {
  if (!secondHandContainer) return;

  // Same performance hints as original
  secondHandContainer.style.willChange = "transform";
  secondHandContainer.style.transition = "none";

  if (secondHandShadow) {
    secondHandShadow.style.willChange = "transform";
    secondHandShadow.style.transition = "none";
  }

  function step() {
    const now          = new Date();
    const seconds      = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    // Same formula: 6° per second, plus fraction
    secondsAngle = -(seconds * 6 + (milliseconds / 1000) * 6);

    secondHandContainer.style.transform =
      `rotate(${secondsAngle}deg) translateZ(0)`;

    if (secondHandShadow) {
      secondHandShadow.style.transform =
        `rotate(${secondsAngle - 0.5}deg) translateZ(0)`;
    }

    secondsAnimationFrameId = requestAnimationFrame(step);
  }

  secondsAnimationFrameId = requestAnimationFrame(step);
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
