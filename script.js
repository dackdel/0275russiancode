// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize dark mode from localStorage
  initDarkMode();

  // Create clock hour marks and numbers
  const hourMarksContainer = document.getElementById("clock-hour-marks");

  // Get clock size for responsive positioning
  const clockFace = document.querySelector('.glass-clock-face');
  const clockSize = clockFace ? clockFace.offsetWidth : 350;
  const center = clockSize / 2;
  const radius = clockSize * 0.414; // Proportional radius (145/350 = 0.414)

  // Create hour numbers and minute markers with perfect spacing
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) {
      // Hour number (every 5 minutes)
      const hourIndex = i / 5;
      const hourNumber = document.createElement("div");
      hourNumber.className = "clock-number";

      // Calculate position for numbers - perfectly centered around the clock
      const angle = (i * 6 * Math.PI) / 180;
      const left = center + Math.sin(angle) * radius - 12;
      const top = center - Math.cos(angle) * radius - 9;

      hourNumber.style.left = `${left}px`;
      hourNumber.style.top = `${top}px`;
      
      // Numbers go counterclockwise: 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
      let displayNumber;
      if (hourIndex === 0) {
        displayNumber = "12";
      } else {
        displayNumber = (12 - hourIndex).toString();
      }
      hourNumber.textContent = displayNumber;

      hourMarksContainer.appendChild(hourNumber);
    } else {
      // Minute marker (line)
      const minuteMarker = document.createElement("div");
      minuteMarker.className = "minute-marker";
      minuteMarker.style.transform = `rotate(${i * 6}deg)`;
      hourMarksContainer.appendChild(minuteMarker);
    }
  }

  // Set fixed light angles
  document.documentElement.style.setProperty("--primary-light-angle", "-45deg");
  document.documentElement.style.setProperty("--dark-edge-angle", "135deg");

  // Set fixed glossy overlay
  const glossyOverlay = document.getElementById("glass-glossy-overlay");
  if (glossyOverlay) {
    glossyOverlay.style.background = `linear-gradient(135deg, 
      rgba(255, 255, 255, 0.9) 0%, 
      rgba(255, 255, 255, 0.7) 15%, 
      rgba(255, 255, 255, 0.5) 25%,
      rgba(255, 255, 255, 0.3) 50%, 
      rgba(255, 255, 255, 0.2) 75%, 
      rgba(255, 255, 255, 0.1) 100%)`;
    glossyOverlay.style.filter = "blur(10px)";
  }

  // Set fixed reflection overlay
  const reflectionOverlay = document.getElementById("glass-reflection-overlay");
  if (reflectionOverlay) {
    reflectionOverlay.style.transform = "rotate(-15deg)";
    reflectionOverlay.style.filter = "blur(10px)";
  }

  // Set the initial CSS variables
  document.documentElement.style.setProperty("--inner-shadow-opacity", "0.15");
  document.documentElement.style.setProperty("--reflection-opacity", "0.5");
  document.documentElement.style.setProperty("--glossy-opacity", "0.3");

  // Start the clock animation
  startClock();
});

// Variables for the seconds hand
let secondsAngle = 0;
let animationFrameId = null;
let secondsMode = "smooth"; // Default to smooth movement

// Function to start the clock
function startClock() {
  // Get the current time for hour and minute hands
  updateHourAndMinuteHands();

  // Start the seconds hand animation based on the selected mode
  animateSecondHand();
}

// Function to update hour and minute hands based on real time
function updateHourAndMinuteHands() {
  const now = new Date();

  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourHand = document.getElementById("hour-hand");
  const minuteHand = document.getElementById("minute-hand");

  if (hourHand && minuteHand) {
    // REVERSE MOVEMENT: Negate the angles to make hands move counterclockwise
    // Include seconds in the calculation for smooth movement
    const hoursDegrees = -(hours * 30 + (minutes / 60) * 30 + (seconds / 3600) * 30);
    const minutesDegrees = -(minutes * 6 + (seconds / 60) * 6);

    hourHand.style.transform = `rotate(${hoursDegrees}deg)`;
    minuteHand.style.transform = `rotate(${minutesDegrees}deg)`;
  }

  // Update date display with simple month and day format (only needs to update once)
  const dateDisplay = document.getElementById("clock-date");
  if (dateDisplay && !dateDisplay.textContent) {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    const month = months[now.getMonth()];
    const day = now.getDate();
    dateDisplay.textContent = `${month} ${day}`;
  }

  // Update timezone display with system timezone (only needs to update once)
  const timezoneDisplay = document.getElementById("clock-timezone");
  if (timezoneDisplay && !timezoneDisplay.hasAttribute('data-initialized')) {
    // Get timezone abbreviation from system
    const timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Extract city name from timezone (e.g., "America/New_York" -> "New York")
    const cityName = timezoneName.split('/').pop().replace(/_/g, ' ');
    timezoneDisplay.textContent = cityName;
    timezoneDisplay.setAttribute('data-initialized', 'true');
  }

  // Continue updating smoothly
  requestAnimationFrame(updateHourAndMinuteHands);
}

// Function to animate the seconds hand based on the selected mode
function animateSecondHand() {
  // Cancel any existing animation
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  const secondHandContainer = document.getElementById("second-hand-container");
  const secondHandShadow = document.getElementById("second-hand-shadow");

  if (!secondHandContainer) return;

  // Different animation modes
  switch (secondsMode) {
    case "tick1": // Tick every second (60 ticks per minute)
      animateTickMode(secondHandContainer, secondHandShadow, 6, 1); // 6 degrees per tick, 1 tick per second
      break;
    case "tick2": // Half-second ticks (120 ticks per minute)
      animateTickMode(secondHandContainer, secondHandShadow, 3, 2); // 3 degrees per tick, 2 ticks per second
      break;
    case "highFreq": // High-frequency sweep (8 ticks per second)
      animateTickMode(secondHandContainer, secondHandShadow, 0.75, 8); // 0.75 degrees per tick, 8 ticks per second
      break;
    case "smooth": // Smooth movement over 60 seconds
    default:
      animateSmoothMode(secondHandContainer, secondHandShadow);
      break;
  }
}

// Function to animate with ticking motion
function animateTickMode(
  secondHandContainer,
  secondHandShadow,
  degreesPerTick,
  ticksPerSecond
) {
  let lastTickTime = 0;
  const intervalMs = 1000 / ticksPerSecond;

  function tick() {
    // Get current time
    const now = new Date();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    // Calculate the current time in milliseconds within the minute
    const timeInMs = seconds * 1000 + milliseconds;

    // Calculate which tick we should be on
    const tickIndex = Math.floor(timeInMs / intervalMs);
    const currentTickTime = tickIndex * intervalMs;

    // Only update if we've moved to a new tick
    if (currentTickTime !== lastTickTime) {
      lastTickTime = currentTickTime;

      // Calculate the angle based on the tick index
      // For high-frequency ticks, we need to ensure we complete a full rotation in 60 seconds
      const totalTicksInRotation = ticksPerSecond * 60; // Total ticks in a full rotation
      const currentTick = tickIndex % totalTicksInRotation;
      
      // REVERSE MOVEMENT: Negate the angle to make it move counterclockwise
      secondsAngle = -(currentTick * (360 / totalTicksInRotation));

      // Apply the rotation with a snap motion
      secondHandContainer.style.transition = "none";
      secondHandContainer.style.transform = `rotate(${secondsAngle}deg)`;

      if (secondHandShadow) {
        secondHandShadow.style.transition = "none";
        secondHandShadow.style.transform = `rotate(${secondsAngle - 0.5}deg)`;
      }
    }

    // Schedule the next check
    setTimeout(tick, 10); // Check frequently to catch the exact tick moments
  }

  // Start ticking
  tick();
}

// Function to animate with smooth motion
function animateSmoothMode(secondHandContainer, secondHandShadow) {
  // Enable hardware acceleration and smoother rendering
  secondHandContainer.style.willChange = 'transform';
  secondHandContainer.style.transition = 'none';
  
  if (secondHandShadow) {
    secondHandShadow.style.willChange = 'transform';
    secondHandShadow.style.transition = 'none';
  }

  function animate(timestamp) {
    // Get current time with millisecond precision
    const now = new Date();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    // Calculate the exact angle based on real time
    // Each second is 6 degrees (360/60), and we add the millisecond fraction
    // REVERSE MOVEMENT: Negate the angle to make it move counterclockwise
    secondsAngle = -(seconds * 6 + (milliseconds / 1000) * 6);

    // Use transform3d for better hardware acceleration
    secondHandContainer.style.transform = `rotate(${secondsAngle}deg) translateZ(0)`;

    if (secondHandShadow) {
      secondHandShadow.style.transform = `rotate(${secondsAngle - 0.5}deg) translateZ(0)`;
    }

    // Request next frame for smooth animation
    animationFrameId = requestAnimationFrame(animate);
  }

  // Start animation
  animationFrameId = requestAnimationFrame(animate);
}

// Dark Mode Functions
function initDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  
  // Check if user has a saved preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
  }
  
  // Add click event listener to toggle button
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  
  // Save preference to localStorage
  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
}
