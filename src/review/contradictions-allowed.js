const root = document.documentElement;
const accumulation = document.querySelector("[data-accumulation]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

root.classList.add("has-contradiction-motion");

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
let scrollFrame = 0;

function updateAccumulation() {
  scrollFrame = 0;

  if (!accumulation || reducedMotion.matches) {
    root.style.setProperty("--truth-progress", "1");
    return;
  }

  const bounds = accumulation.getBoundingClientRect();
  const travel = Math.max(1, accumulation.offsetHeight - window.innerHeight);
  root.style.setProperty("--truth-progress", clamp(-bounds.top / travel).toFixed(4));
}

function requestAccumulationUpdate() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(updateAccumulation);
}

window.addEventListener("scroll", requestAccumulationUpdate, { passive: true });
window.addEventListener("resize", requestAccumulationUpdate);
reducedMotion.addEventListener?.("change", requestAccumulationUpdate);
updateAccumulation();

const revealTargets = [...document.querySelectorAll("[data-contradiction-reveal]")];

if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.1 },
  );

  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}
