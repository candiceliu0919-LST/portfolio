const opening = document.querySelector("[data-opening]");
const objection = document.querySelector("[data-objection]");
const scrollExit = document.querySelector("[data-scroll-to-lobby]");
const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const range = (value, start, end) => clamp((value - start) / (end - start));
const ease = (value) =>
  value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
const smooth = (value) => value * value * (3 - 2 * value);
const mix = (from, to, amount) => from + (to - from) * amount;

let ticking = false;
let touchStartY = 0;
let leavingOpening = false;
let mobileExitTimer = 0;
let lastScrollY = window.scrollY;

const distanceFromEnd = () =>
  Math.max(
    0,
    document.documentElement.scrollHeight - (window.scrollY + window.innerHeight),
  );

const endTolerance = () => Math.min(96, Math.max(40, window.innerHeight * 0.07));
const isAtEnd = () => distanceFromEnd() <= endTolerance();

function enterLobby() {
  if (leavingOpening) return;
  leavingOpening = true;
  window.location.assign("./five-worlds-lobby.html");
}

function setNumber(name, value, precision = 4) {
  root.style.setProperty(name, Number(value.toFixed(precision)));
}

function setUnit(name, value, unit) {
  root.style.setProperty(name, `${value.toFixed(3)}${unit}`);
}

function render() {
  ticking = false;

  if (!opening || reducedMotion.matches) {
    root.style.setProperty("--p", 1);
    return;
  }

  const travel = Math.max(1, opening.offsetHeight - window.innerHeight);
  const p = clamp(-opening.getBoundingClientRect().top / travel);
  const approach = ease(range(p, 0.14, 0.5));
  const memoryExit = smooth(range(p, 0.41, 0.57));
  const reveal = ease(range(p, 0.34, 0.69));
  const settle = ease(range(p, 0.72, 0.83));
  const cover = smooth(range(p, 0.87, 0.98));
  const noteIn = smooth(range(p, 0.55, 0.59));
  const noteOut = 1 - smooth(range(p, 0.66, 0.71));

  setNumber("--p", p);
  setNumber("--memory-scale", mix(1, 8.8, approach));
  setUnit("--memory-x", mix(-4, 1.5, approach), "vw");
  setUnit("--memory-y", mix(1, -1.5, approach), "vh");
  setNumber("--memory-opacity", 1 - memoryExit);
  setUnit("--memory-blur", mix(0, 7, memoryExit), "px");

  const thresholdLife = Math.sin(Math.PI * range(p, 0.3, 0.58));
  setNumber("--threshold-opacity", Math.max(0, thresholdLife * 0.7));
  setUnit("--threshold-size", mix(14, 112, ease(range(p, 0.3, 0.58))), "vmin");

  setNumber("--present-opacity", smooth(range(p, 0.38, 0.56)));
  setUnit("--present-reveal", mix(3, 92, reveal), "%");
  setNumber("--present-scale", mix(1.16, 1, reveal));
  setUnit("--present-x", mix(2.5, 0, reveal), "vw");
  setUnit("--present-top", mix(4, 0, settle), "vh");
  setUnit("--present-right", mix(3, 0, settle), "vw");
  setUnit("--present-bottom", mix(4, 0, settle), "vh");
  setUnit("--present-left", mix(14, 30, settle), "vw");

  setNumber("--note-opacity", noteIn * noteOut);
  setUnit("--note-y", mix(8, 0, noteIn), "px");
  setNumber("--cover-opacity", cover);
  setNumber("--ui-opacity", 1 - smooth(range(p, 0.1, 0.25)));
  setNumber("--cue-opacity", 1 - smooth(range(p, 0.05, 0.14)));
}

function requestRender() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(render);
}

function handleScroll() {
  requestRender();

  const currentScrollY = window.scrollY;
  const movedTowardEnd = currentScrollY > lastScrollY;
  lastScrollY = currentScrollY;

  if (!isAtEnd()) {
    window.clearTimeout(mobileExitTimer);
    return;
  }

  if (movedTowardEnd) {
    window.clearTimeout(mobileExitTimer);
    mobileExitTimer = window.setTimeout(() => {
      if (isAtEnd()) enterLobby();
    }, 900);
  }
}

function reconsider() {
  const changed = objection.dataset.changed === "true";
  objection.dataset.changed = String(!changed);
  objection.textContent = changed ? "本人暂时没有异议。" : "现在有一点。";
  objection.classList.remove("is-reconsidering");
  void objection.offsetWidth;
  objection.classList.add("is-reconsidering");
}

objection?.addEventListener("click", reconsider);
objection?.addEventListener("animationend", () => {
  objection.classList.remove("is-reconsidering");
});

window.addEventListener(
  "wheel",
  (event) => {
    const finalGestureRange = Math.min(240, Math.max(24, event.deltaY * 1.1));
    if (event.deltaY > 16 && distanceFromEnd() <= finalGestureRange) enterLobby();
  },
  { passive: true },
);

window.addEventListener(
  "touchstart",
  (event) => {
    touchStartY = event.changedTouches[0]?.clientY ?? 0;
  },
  { passive: true },
);

function continueFromTouch(event) {
  const touchY =
    event.changedTouches[0]?.clientY ?? event.touches[0]?.clientY ?? touchStartY;
  const continuedDown = touchStartY - touchY > 24;

  if (continuedDown && isAtEnd()) enterLobby();
}

window.addEventListener("touchmove", continueFromTouch, { passive: true });
window.addEventListener("touchend", continueFromTouch, { passive: true });
window.addEventListener("touchcancel", continueFromTouch, { passive: true });

window.addEventListener("keydown", (event) => {
  const continuesDown =
    event.key === "ArrowDown" ||
    event.key === "PageDown" ||
    event.key === "End" ||
    (event.key === " " && !event.shiftKey);

  if (continuesDown && isAtEnd()) enterLobby();
});

scrollExit?.addEventListener("click", enterLobby);

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", requestRender);
reducedMotion.addEventListener("change", requestRender);
requestRender();
