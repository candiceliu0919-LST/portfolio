const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealTargets = [...document.querySelectorAll("[data-manual-reveal]")];
const diagnostic = document.querySelector("[data-diagnostic]");
const diagnosticTrigger = document.querySelector("[data-diagnostic-trigger]");
const diagnosticResult = document.querySelector("[data-diagnostic-result]");

root.classList.add("has-manual-motion");

if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10%", threshold: 0.08 },
  );

  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}

diagnosticTrigger?.addEventListener("click", () => {
  const isVerified = diagnostic?.classList.toggle("is-verified") ?? false;
  diagnosticTrigger.setAttribute("aria-expanded", String(isVerified));
  diagnosticResult?.setAttribute("aria-hidden", String(!isVerified));
});
