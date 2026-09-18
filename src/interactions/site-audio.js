const STORAGE_KEY = "kankan-vol30:audio-state:v1";
const AUDIO_MESSAGE = "kankan-vol30:audio";
const AUDIO_SOURCE = new URL(
  "../../source-assets/audio/landing-guy-web.m4a",
  import.meta.url,
).href;

const stylesheet = document.createElement("link");
stylesheet.rel = "stylesheet";
stylesheet.href = new URL("../styles/site-audio.css?rev=07", import.meta.url).href;
stylesheet.dataset.siteAudioStyles = "";
document.head.append(stylesheet);

const readState = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    return {};
  }
};

const state = readState();
let shouldPlay = state.enabled === true;
let hasChosen = state.choiceMade === true;
const isShellHost = document.body.hasAttribute("data-site-shell");
const isShellClient = window.parent !== window;

const control = document.createElement("button");
control.type = "button";
control.className = "site-audio-toggle";
control.dataset.audioState = shouldPlay ? "resume" : "off";
control.innerHTML = `
  <svg class="site-audio-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
    <path class="site-audio-toggle__speaker" d="M4.5 9.25h3.25L12 5.7v12.6l-4.25-3.55H4.5z" />
    <path class="site-audio-toggle__wave site-audio-toggle__wave--near" d="M15 9.05c.75.75 1.12 1.73 1.12 2.95S15.75 14.2 15 14.95" />
    <path class="site-audio-toggle__wave site-audio-toggle__wave--far" d="M17.65 6.55c1.35 1.35 2.03 3.17 2.03 5.45s-.68 4.1-2.03 5.45" />
    <path class="site-audio-toggle__slash" d="M5 4.75 19 19.25" />
  </svg>
  <span class="site-audio-toggle__label">SOUND / OFF</span>
`;
document.body.append(control);

const label = control.querySelector(".site-audio-toggle__label");

const render = (mode) => {
  control.dataset.audioState = mode;
  control.disabled = mode === "unavailable";

  if (mode === "on") {
    label.textContent = "SOUND / ON";
    control.setAttribute("aria-label", "关闭背景音乐");
    control.setAttribute("aria-pressed", "true");
    return;
  }

  if (mode === "resume") {
    label.textContent = "SOUND / RESUME";
    control.setAttribute("aria-label", "继续播放背景音乐");
    control.setAttribute("aria-pressed", "false");
    return;
  }

  if (mode === "unavailable") {
    label.textContent = "SOUND / UNAVAILABLE";
    control.setAttribute("aria-label", "背景音乐暂时无法播放");
    control.setAttribute("aria-pressed", "false");
    return;
  }

  label.textContent = "SOUND / OFF";
  control.setAttribute("aria-label", "播放背景音乐");
  control.setAttribute("aria-pressed", "false");
};

if (isShellClient) {
  control.addEventListener("click", () => {
    window.parent.postMessage({ type: AUDIO_MESSAGE, action: "toggle" }, window.location.origin);
  });

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    if (event.data?.type !== AUDIO_MESSAGE || event.data?.action !== "state") return;
    render(event.data.mode || "off");
  });

  window.parent.postMessage({ type: AUDIO_MESSAGE, action: "request-state" }, window.location.origin);
  render(shouldPlay ? "resume" : "off");
} else {
  const audio = document.createElement("audio");
  audio.src = AUDIO_SOURCE;
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = 0.26;
  audio.dataset.siteAudio = "";
  audio.setAttribute("aria-hidden", "true");
  document.body.append(audio);

  const persist = () => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          enabled: shouldPlay,
          choiceMade: hasChosen,
          currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
        }),
      );
    } catch {
      // Audio remains usable even when storage is unavailable.
    }
  };

  const currentMode = () => {
    if (!shouldPlay) return "off";
    return audio.paused ? "resume" : "on";
  };

  const sendState = (target = null) => {
    const frame = document.querySelector("[data-site-frame]");
    const recipient = target || frame?.contentWindow;
    recipient?.postMessage(
      { type: AUDIO_MESSAGE, action: "state", mode: currentMode() },
      window.location.origin,
    );
  };

  const renderAndShare = (mode) => {
    render(mode);
    sendState();
  };

  const startPlayback = async () => {
    try {
      await audio.play();
      renderAndShare("on");
    } catch {
      renderAndShare("resume");
    }
  };

  function closeGate(gate) {
    gate.classList.add("is-leaving");
    document.body.classList.remove("has-audio-gate");
    window.setTimeout(() => gate.remove(), 320);
  }

  function showSoundGate() {
    const gate = document.createElement("section");
    gate.className = "site-audio-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "site-audio-gate-title");
    gate.innerHTML = `
      <div class="site-audio-gate__panel">
        <p class="site-audio-gate__coordinate">KANKAN, VOL.30 / BEFORE ENTRY</p>
        <h1 id="site-audio-gate-title" aria-label="THIS PAGE HAS A SOUNDTRACK.">
          <span class="site-audio-gate__title-desktop" aria-hidden="true">THIS PAGE HAS<br />A SOUNDTRACK.</span>
          <span class="site-audio-gate__title-mobile" aria-hidden="true">THIS PAGE<br />HAS A<br />SOUNDTRACK.</span>
        </h1>
        <p class="site-audio-gate__chinese">这里有音乐。</p>
        <div class="site-audio-gate__choices">
          <button type="button" data-enter-with-sound>带声音进入 <span>↗</span></button>
          <button type="button" data-enter-quietly>安静一点</button>
        </div>
      </div>
    `;

    document.body.classList.add("has-audio-gate");
    document.body.append(gate);

    const soundChoice = gate.querySelector("[data-enter-with-sound]");
    const quietChoice = gate.querySelector("[data-enter-quietly]");

    soundChoice.addEventListener("click", async () => {
      hasChosen = true;
      shouldPlay = true;
      persist();
      await startPlayback();
      persist();
      closeGate(gate);
    });

    quietChoice.addEventListener("click", () => {
      hasChosen = true;
      shouldPlay = false;
      audio.pause();
      renderAndShare("off");
      persist();
      closeGate(gate);
    });

    window.requestAnimationFrame(() => soundChoice.focus());
  }

  audio.addEventListener(
    "loadedmetadata",
    () => {
      const rememberedTime = Number(state.currentTime);
      if (
        Number.isFinite(rememberedTime) &&
        rememberedTime > 0 &&
        rememberedTime < audio.duration
      ) {
        audio.currentTime = rememberedTime;
      }
    },
    { once: true },
  );

  audio.addEventListener("error", () => renderAndShare("unavailable"));
  audio.addEventListener("playing", () => renderAndShare("on"));
  audio.addEventListener("pause", () => {
    renderAndShare(shouldPlay ? "resume" : "off");
  });

  control.addEventListener("click", async () => {
    if (!audio.paused) {
      shouldPlay = false;
      audio.pause();
      persist();
      return;
    }

    hasChosen = true;
    shouldPlay = true;
    persist();
    await startPlayback();
  });

  if (isShellHost) {
    window.addEventListener("message", async (event) => {
      if (event.origin !== window.location.origin) return;
      const frame = document.querySelector("[data-site-frame]");
      if (!frame || event.source !== frame.contentWindow) return;
      if (event.data?.type !== AUDIO_MESSAGE) return;

      if (event.data.action === "request-state") {
        sendState(event.source);
        return;
      }

      if (event.data.action === "toggle") {
        hasChosen = true;
        if (!audio.paused) {
          shouldPlay = false;
          audio.pause();
          persist();
          return;
        }

        shouldPlay = true;
        persist();
        await startPlayback();
      }
    });

    document.querySelector("[data-site-frame]")?.addEventListener("load", () => sendState());
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && shouldPlay && audio.paused) startPlayback();
  });
  window.addEventListener("pagehide", persist);

  render(shouldPlay ? "resume" : "off");
  const opening = document.querySelector("[data-opening]");
  if ((isShellHost || opening) && !hasChosen) {
    showSoundGate();
  } else if (shouldPlay) {
    startPlayback();
  }
}
