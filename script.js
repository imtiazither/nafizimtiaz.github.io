const progressFill = document.querySelector(".page-rail__fill");
const journeyFill = document.querySelector(".journey__line-fill");
const journeyLine = document.querySelector(".journey__line");
const journeyWalker = document.querySelector(".journey__walker");
const siteHeader = document.querySelector(".site-header");
const journeyWalkerFrameLeft = document.querySelector(".journey__walker-frame--left");
const journeyWalkerFrameRight = document.querySelector(".journey__walker-frame--right");
const journeyItems = [...document.querySelectorAll(".journey-item")];
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".site-nav a")];
const revealItems = [...document.querySelectorAll(".reveal:not(.paper)")];
const heroPanel = document.querySelector("[data-parallax]");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const themeToggle = document.querySelector(".theme-toggle");
const themeToggleLabel = document.querySelector(".theme-toggle__label");
const form = document.querySelector("#contact-form");
const formStatus = document.querySelector(".form-status");
const resumeModal = document.querySelector("#resume-modal");
const resumeOpeners = [...document.querySelectorAll("[data-resume-open]")];
const resumeClosers = [...document.querySelectorAll("[data-resume-close]")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const themeStorageKey = "nafiz-personal-theme";
let lastResumeTrigger = null;
const journeyWalkerState = {
  targetY: 0,
  currentY: 0,
  frame: 0,
  rafId: 0,
  ready: false,
};
const journeyWalkerPhaseDistance = 4;
const journeyWalkerPoseHoldFrames = 4;
const journeyWalkerSequenceLength = journeyWalkerPoseHoldFrames * 2;
const journeyWalkerSmoothing = 0.22;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function applyJourneyWalkerFrame(frame) {
  if (!journeyWalker) return;

  journeyWalker.classList.toggle("journey__walker--left", frame === 0);
  journeyWalker.classList.toggle("journey__walker--right", frame === 1);

  if (journeyWalkerFrameLeft) {
    journeyWalkerFrameLeft.style.visibility = frame === 0 ? "visible" : "hidden";
    journeyWalkerFrameLeft.style.opacity = frame === 0 ? "1" : "0";
  }

  if (journeyWalkerFrameRight) {
    journeyWalkerFrameRight.style.visibility = frame === 1 ? "visible" : "hidden";
    journeyWalkerFrameRight.style.opacity = frame === 1 ? "1" : "0";
  }
}

function preloadJourneyWalkerFrames() {
  const frameSources = [
    journeyWalkerFrameLeft?.getAttribute("src"),
    journeyWalkerFrameRight?.getAttribute("src"),
  ].filter(Boolean);

  frameSources.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

function getJourneyWalkerFrameForY(positionY) {
  const phase = Math.floor(Math.max(positionY, 0) / journeyWalkerPhaseDistance) % journeyWalkerSequenceLength;
  return phase < journeyWalkerPoseHoldFrames ? 0 : 1;
}

function renderJourneyWalker() {
  if (!journeyWalker) return;

  journeyWalkerState.rafId = 0;

  if (!journeyWalkerState.ready) {
    journeyWalkerState.ready = true;
    journeyWalkerState.currentY = journeyWalkerState.targetY;
    journeyWalkerState.frame = getJourneyWalkerFrameForY(journeyWalkerState.currentY);
    journeyWalker.style.setProperty("--journey-walker-y", `${Math.round(journeyWalkerState.currentY)}px`);
    applyJourneyWalkerFrame(journeyWalkerState.frame);
    return;
  }

  const deltaToTarget = journeyWalkerState.targetY - journeyWalkerState.currentY;

  if (Math.abs(deltaToTarget) < 0.2) {
    journeyWalkerState.currentY = journeyWalkerState.targetY;
  } else {
    journeyWalkerState.currentY += deltaToTarget * journeyWalkerSmoothing;
  }

  const nextFrame = getJourneyWalkerFrameForY(journeyWalkerState.currentY);

  if (nextFrame !== journeyWalkerState.frame) {
    journeyWalkerState.frame = nextFrame;
    applyJourneyWalkerFrame(journeyWalkerState.frame);
  }

  journeyWalker.style.setProperty("--journey-walker-y", `${Math.round(journeyWalkerState.currentY)}px`);

  if (Math.abs(journeyWalkerState.targetY - journeyWalkerState.currentY) > 0.2) {
    journeyWalkerState.rafId = window.requestAnimationFrame(renderJourneyWalker);
  } else {
    journeyWalkerState.currentY = journeyWalkerState.targetY;
    journeyWalkerState.frame = getJourneyWalkerFrameForY(journeyWalkerState.currentY);
    applyJourneyWalkerFrame(journeyWalkerState.frame);
    journeyWalker.style.setProperty("--journey-walker-y", `${Math.round(journeyWalkerState.currentY)}px`);
    journeyWalkerState.rafId = 0;
  }
}

function updateJourneyWalkerTarget(nextY) {
  if (!journeyWalker) return;

  journeyWalkerState.targetY = nextY;

  if (reduceMotion) {
    journeyWalkerState.ready = true;
    journeyWalkerState.currentY = nextY;
    journeyWalkerState.frame = getJourneyWalkerFrameForY(nextY);
    applyJourneyWalkerFrame(journeyWalkerState.frame);
    journeyWalker.style.setProperty("--journey-walker-y", `${Math.round(nextY)}px`);
    return;
  }

  if (!journeyWalkerState.rafId) {
    journeyWalkerState.rafId = window.requestAnimationFrame(renderJourneyWalker);
  }
}

function updatePageProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;

  if (progressFill) {
    progressFill.style.transform = `scaleY(${clamp(progress, 0, 1)})`;
  }
}

function updateHeaderState() {
  if (!siteHeader) return;

  siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);
}

function updateJourneyProgress() {
  if (!journeyFill || !journeyLine) return;

  const activationLine = window.innerHeight * 0.6;
  const lineRect = journeyLine.getBoundingClientRect();
  const ratio =
    lineRect.height > 0 ? clamp((activationLine - lineRect.top) / lineRect.height, 0, 1) : 0;
  const lineTip = lineRect.top + lineRect.height * ratio;

  journeyFill.style.transform = `scaleY(${ratio})`;

  if (journeyWalker) {
    const walkerY = lineRect.height * ratio;
    updateJourneyWalkerTarget(walkerY);
  }

  journeyItems.forEach((item) => {
    const point = item.querySelector(".journey-item__point");
    const pointRect = point?.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const pointY = pointRect
      ? pointRect.top + pointRect.height / 2
      : itemRect.top + itemRect.height / 2;
    const hasReachedMidpoint = pointY <= lineTip + 1;
    const hasCrossedTopBorder = itemRect.top < 0;
    const isActive = hasReachedMidpoint && !hasCrossedTopBorder;
    const wasActive = item.classList.contains("is-active");

    if (isActive && !wasActive && !reduceMotion) {
      item.classList.remove("just-hit");

      if (item.milestoneTimer) {
        window.clearTimeout(item.milestoneTimer);
      }

      void item.offsetWidth;
      item.classList.add("just-hit");
      item.milestoneTimer = window.setTimeout(() => {
        item.classList.remove("just-hit");
      }, 780);
    } else if (!isActive) {
      item.classList.remove("just-hit");

      if (item.milestoneTimer) {
        window.clearTimeout(item.milestoneTimer);
        item.milestoneTimer = null;
      }
    }

    item.classList.toggle("is-active", isActive);
  });
}

function updateActiveNav() {
  const trigger = window.innerHeight * 0.28;
  let current = sections[0]?.id;

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= trigger && rect.bottom >= trigger) {
      current = section.id;
    }
  });

  navLinks.forEach((link) => {
    const target = link.getAttribute("href")?.slice(1);
    link.classList.toggle("is-active", target === current);
  });
}

function handleScroll() {
  updateHeaderState();
  updatePageProgress();
  updateJourneyProgress();
  updateActiveNav();
}

function setupRevealObserver() {
  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupParallax() {
  if (!heroPanel || reduceMotion || window.matchMedia("(max-width: 860px)").matches) return;

  const rotateLimit = 1.8;
  const translateLimit = 8;

  window.addEventListener("mousemove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;

    heroPanel.style.transform = `
      perspective(1000px)
      rotateX(${(-y * rotateLimit).toFixed(2)}deg)
      rotateY(${(x * rotateLimit).toFixed(2)}deg)
      translate3d(${(x * translateLimit).toFixed(2)}px, ${(y * -translateLimit).toFixed(2)}px, 0)
    `;
  });

  window.addEventListener("mouseleave", () => {
    heroPanel.style.transform = "";
  });
}

function setupMenu() {
  if (!menuToggle || !siteNav) return;

  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("is-open");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    });
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  if (!themeToggle) return;

  const isDark = theme === "dark";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode"
  );

  if (themeToggleLabel) {
    themeToggleLabel.textContent = isDark ? "Light mode" : "Dark mode";
  }
}

function setupThemeToggle() {
  if (!themeToggle) return;

  const savedTheme = localStorage.getItem(themeStorageKey);
  const preferredTheme =
    savedTheme ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  applyTheme(preferredTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem(themeStorageKey, nextTheme);
    applyTheme(nextTheme);
  });
}

function setupForm() {
  if (!form || !formStatus) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formStatus.textContent =
      "This is still a starter form for now, but the layout is ready for your real contact flow later.";
    form.reset();
  });
}

function openResumeModal(trigger) {
  if (!resumeModal) return;

  lastResumeTrigger = trigger || document.activeElement;
  resumeModal.hidden = false;
  document.body.classList.add("resume-modal-open");

  const closeButton = resumeModal.querySelector(".resume-modal__close");
  closeButton?.focus();
}

function closeResumeModal() {
  if (!resumeModal || resumeModal.hidden) return;

  resumeModal.hidden = true;
  document.body.classList.remove("resume-modal-open");

  if (lastResumeTrigger instanceof HTMLElement) {
    lastResumeTrigger.focus();
  }
}

function setupResumeModal() {
  if (!resumeModal || resumeOpeners.length === 0) return;

  resumeOpeners.forEach((opener) => {
    opener.addEventListener("click", () => openResumeModal(opener));
  });

  resumeClosers.forEach((closer) => {
    closer.addEventListener("click", closeResumeModal);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeResumeModal();
    }
  });
}

setupThemeToggle();
preloadJourneyWalkerFrames();
setupRevealObserver();
setupParallax();
setupMenu();
setupForm();
setupResumeModal();
handleScroll();

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", handleScroll);
