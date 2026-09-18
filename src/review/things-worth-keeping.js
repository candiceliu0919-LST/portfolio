const root = document.documentElement;
const scene = document.querySelector("[data-artifact-scene]");
const dialog = document.querySelector("[data-artifact-dialog]");
const openArtifact = document.querySelector("[data-open-artifact]");
const closeArtifact = document.querySelector("[data-close-artifact]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let ticking = false;

function updateArtifactProgress() {
  ticking = false;
  if (!scene || reduceMotion.matches) return;

  const rect = scene.getBoundingClientRect();
  const travel = Math.max(1, scene.offsetHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, -rect.top / travel));
  root.style.setProperty("--artifact-progress", progress.toFixed(3));
}

function requestProgressUpdate() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateArtifactProgress);
}

if (!reduceMotion.matches) {
  root.classList.add("has-motion");
  updateArtifactProgress();
  window.addEventListener("scroll", requestProgressUpdate, { passive: true });
  window.addEventListener("resize", requestProgressUpdate);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
);

document.querySelectorAll("[data-reveal]").forEach((item) => revealObserver.observe(item));

openArtifact?.addEventListener("click", () => {
  if (typeof dialog?.showModal === "function") {
    dialog.showModal();
    document.body.style.overflow = "hidden";
  }
});

function closeArtifactView() {
  dialog?.close();
  document.body.style.overflow = "";
  openArtifact?.focus();
}

closeArtifact?.addEventListener("click", closeArtifactView);

dialog?.addEventListener("click", (event) => {
  if (event.target === dialog) closeArtifactView();
});

dialog?.addEventListener("close", () => {
  document.body.style.overflow = "";
});
