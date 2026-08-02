/* =====================================================
   Use: Open page link
===================================================== */
function openLink(url) {
  window.open(url, "_blank");
}

const INTRO_SEEN_KEY = "sgm_intro_seen_v1";
const INTRO_MUTE_KEY = "sgm_intro_muted_v1";
let activeIntroAudioContext = null;

/* =====================================================
   Use: Toggle Files Section
===================================================== */
function toggleFiles() {
  const section = document.getElementById("filesSection");
  section.style.display = section.style.display === "none" ? "block" : "none";
}

/* =====================================================
   Use: Text reveal helper
===================================================== */
function setLetterReveal(target, text, staggerMs) {
  if (!target) return;
  target.innerHTML = "";

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const span = document.createElement("span");
    span.className = char === " " ? "welcome-char space" : "welcome-char";
    span.style.setProperty("--char-delay", `${i * staggerMs}ms`);
    span.textContent = char;
    target.appendChild(span);
  }
}

/* =====================================================
   Use: Layered intro sound
===================================================== */
function playIntroAudio(isMuted, shortMode) {
  if (isMuted) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const context = new AudioContextClass();
    activeIntroAudioContext = context;

    const master = context.createGain();
    master.gain.value = shortMode ? 0.028 : 0.04;
    master.connect(context.destination);

    const tone1 = context.createOscillator();
    const tone1Gain = context.createGain();
    tone1.type = "triangle";
    tone1.frequency.setValueAtTime(420, context.currentTime);
    tone1.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.26);
    tone1Gain.gain.setValueAtTime(0.0001, context.currentTime);
    tone1Gain.gain.exponentialRampToValueAtTime(0.95, context.currentTime + 0.05);
    tone1Gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);
    tone1.connect(tone1Gain);
    tone1Gain.connect(master);
    tone1.start();
    tone1.stop(context.currentTime + 0.42);

    const tone2 = context.createOscillator();
    const tone2Gain = context.createGain();
    tone2.type = "sine";
    tone2.frequency.setValueAtTime(760, context.currentTime + 0.12);
    tone2.frequency.exponentialRampToValueAtTime(520, context.currentTime + 0.46);
    tone2Gain.gain.setValueAtTime(0.0001, context.currentTime + 0.1);
    tone2Gain.gain.exponentialRampToValueAtTime(0.6, context.currentTime + 0.2);
    tone2Gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.62);
    tone2.connect(tone2Gain);
    tone2Gain.connect(master);
    tone2.start(context.currentTime + 0.1);
    tone2.stop(context.currentTime + 0.63);

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.24, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 420;

    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(0.0001, context.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.35, context.currentTime + 0.02);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();
    noise.stop(context.currentTime + 0.22);
  } catch (_error) {
    activeIntroAudioContext = null;
  }
}

/* =====================================================
   Use: Intro control state
===================================================== */
function getStoredFlag(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (_error) {
    return null;
  }
}

function setStoredFlag(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (_error) {
    // Ignore storage issues in private mode.
  }
}

function setMuteButtonState(button, isMuted) {
  if (!button) return;
  button.textContent = isMuted ? "Unmute" : "Mute";
  button.classList.toggle("active", isMuted);
}

/* =====================================================
   Use: Stagger content reveal
===================================================== */
function prepareContentReveal() {
  const elements = document.querySelectorAll(".app-shell > *");
  elements.forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${80 + index * 95}ms`);
  });
}

/* =====================================================
   Use: Welcome animation and audio
===================================================== */
function startWelcomeSequence() {
  const overlay = document.getElementById("welcomeOverlay");
  const title = document.getElementById("welcomeTitle");
  const subtitle = document.getElementById("welcomeSubtitle");
  const status = document.getElementById("welcomeStatus");
  const skipBtn = document.getElementById("skipIntroBtn");
  const muteBtn = document.getElementById("muteIntroBtn");

  if (!overlay) {
    document.body.classList.add("content-ready");
    return;
  }

  const isRepeatVisit = getStoredFlag(INTRO_SEEN_KEY) === "1";
  const isMobile = window.matchMedia("(max-width: 700px)").matches;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shortMode = isRepeatVisit || prefersReducedMotion;
  let isMuted = getStoredFlag(INTRO_MUTE_KEY) === "1";

  const introDuration = shortMode
    ? (isMobile ? 900 : 1200)
    : (isMobile ? 1900 : 2600);

  overlay.style.setProperty("--load-duration", `${Math.max(0.7, introDuration / 1000 - 0.2)}s`);
  if (subtitle) {
    subtitle.style.animationDelay = shortMode ? "140ms" : "460ms";
  }

  setLetterReveal(title, "Shri Ganesh Motors", shortMode ? 20 : 40);
  if (status) {
    status.textContent = shortMode ? "Welcome back..." : "Initializing dashboard...";
  }
  setMuteButtonState(muteBtn, isMuted);

  overlay.classList.add("show");
  overlay.classList.remove("hide");
  document.body.classList.remove("content-ready");

  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      setStoredFlag(INTRO_MUTE_KEY, isMuted ? "1" : "0");
      setMuteButtonState(muteBtn, isMuted);
    });
  }

  let completed = false;
  const finishIntro = () => {
    if (completed) return;
    completed = true;

    if (activeIntroAudioContext) {
      activeIntroAudioContext.close().catch(() => {});
      activeIntroAudioContext = null;
    }

    setStoredFlag(INTRO_SEEN_KEY, "1");
    overlay.classList.remove("show");
    overlay.classList.add("hide");
    document.body.classList.add("content-ready");

    if (status) {
      status.textContent = "Ready";
    }
  };

  if (skipBtn) {
    skipBtn.addEventListener("click", finishIntro, { once: true });
  }

  playIntroAudio(isMuted, shortMode);
  setTimeout(finishIntro, introDuration);
}

/* =====================================================
   Use: Animated background particles
===================================================== */
function initParticles() {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particleCount = Math.min(60, Math.max(30, Math.floor(width / 24)));
  const particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    size: Math.random() * 2.4 + 0.7,
    opacity: Math.random() * 0.5 + 0.2
  }));

  let animationFrame;
  const animate = () => {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${particle.opacity})`;
      ctx.fill();

      for (let j = index + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(255,255,255,${0.08 * (1 - dist / 120)})`;
          ctx.stroke();
        }
      }
    });

    animationFrame = window.requestAnimationFrame(animate);
  };

  if (animationFrame) window.cancelAnimationFrame(animationFrame);
  animate();
}

/* =====================================================
   Use: Search tools and records
===================================================== */
function setupSearch() {
  const searchInput = document.getElementById("toolSearch");
  const searchStatus = document.getElementById("searchStatus");
  const cards = Array.from(document.querySelectorAll(".card"));

  if (!searchInput || !searchStatus) return;

  const updateSearch = () => {
    const term = searchInput.value.trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const text = (card.dataset.search || card.textContent).toLowerCase();
      const match = text.includes(term);
      card.style.display = match ? "flex" : "none";
      if (match) visible += 1;
    });

    searchStatus.textContent = term
      ? `Showing ${visible} match${visible === 1 ? "" : "es"}`
      : "Showing all tools";
  };

  searchInput.addEventListener("input", updateSearch);
  updateSearch();
}

window.addEventListener("load", () => {
  prepareContentReveal();
  startWelcomeSequence();
  initParticles();
  setupSearch();
});
window.addEventListener("resize", initParticles);
