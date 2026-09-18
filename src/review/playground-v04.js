import { createVisitorTraces } from "./visitor-traces-v02.js?rev=01";

const field = document.querySelector("[data-playground-field]");
const quietMark = document.querySelector("[data-quiet-mark]");

const pressButton = document.querySelector("[data-do-not-press]");
const pressResponse = document.querySelector("[data-press-response]");
const eventTrigger = document.querySelector("[data-event-trigger]");
const triggerGlyph = document.querySelector("[data-trigger-glyph]");
const eventStage = document.querySelector("[data-event-stage]");
const eventCoordinate = document.querySelector("[data-event-coordinate]");
const eventBody = document.querySelector("[data-event-body]");
const eventClose = document.querySelector("[data-event-close]");
const nonEvent = document.querySelector("[data-non-event]");

const visitorTraces = createVisitorTraces({
  eventBody,
  openStage,
  closeStage,
  onBeforeYouGoOpen: () => usedOnce.add("visitor-note"),
});

const pressMessages = [
  "上当了吧，这个点不动哦。",
  "怎么还点。",
  "你真的很执着。",
  "……行吧。",
];

const triggerPositions = ["position-a", "position-b", "position-c", "position-d"];
const triggerGlyphs = ["?", "·", "○", "?"];
const stageVariants = ["event-stage--edge", "event-stage--quiet", "event-stage--system"];

const eventDefinitions = [
  { id: "moon", min: 0, weight: 3.3, kind: "thought", long: true },
  { id: "adulthood", min: 1, weight: 2.2, kind: "thought" },
  { id: "visual", min: 0, weight: 5.2, kind: "behavior" },
  { id: "nothing", min: 0, weight: 0.8, kind: "behavior" },
  { id: "animal", min: 2, weight: 3.6, kind: "thought", long: true },
  { id: "cat", min: 2, weight: 3.1, kind: "thought" },
  { id: "duplicate", min: 2, weight: 2.8, kind: "thought" },
  { id: "life-change", min: 3, weight: 2.5, kind: "thought", long: true },
  { id: "ctrl-z", min: 3, weight: 2.4, kind: "reflective", long: true },
  { id: "rename", min: 3, weight: 2.9, kind: "thought", long: true },
  { id: "ghost", min: 3, weight: 2.5, kind: "thought" },
  { id: "behavior", min: 4, weight: 3, kind: "behavior" },
  { id: "meta-still-clicking", min: 5, weight: 1.6, kind: "meta", once: true },
  { id: "circle", min: 6, weight: 2, kind: "behavior", once: true },
  { id: "message-18", min: 5, weight: 1.35, kind: "reflective", long: true, once: true },
  { id: "age-18", min: 6, weight: 0.9, kind: "reflective", long: true },
  { id: "visitor-note", min: 10, weight: 0.8, kind: "human", long: true, once: true },
  { id: "thanks", min: 12, weight: 0.45, kind: "behavior", once: true },
  { id: "photo-fortune", min: 1, weight: 1.7, kind: "image", once: true },
  { id: "photo-childhood-02", min: 1, weight: 1.55, kind: "image", once: true },
  { id: "photo-hotpot", min: 2, weight: 1.45, kind: "image", once: true },
  { id: "photo-cat", min: 2, weight: 1.65, kind: "image", once: true },
  { id: "photo-kankan-ip", min: 3, weight: 1.25, kind: "image", once: true },
  { id: "photo-childhood-01", min: 3, weight: 1.45, kind: "image", once: true },
];

const photoDiscoveries = {
  "photo-fortune": {
    src: "./public/assets/image-pass-v1/playground-fortune.webp",
    alt: "一张写着关于一夜暴富的话的生活截图。",
    width: 1000,
    height: 1000,
    treatment: "corner",
  },
  "photo-childhood-02": {
    src: "./public/assets/image-pass-v1/playground-childhood-meme-02.webp",
    alt: "由 Kankan 小时候的照片做成的表情包。",
    width: 900,
    height: 1600,
    treatment: "found-print",
  },
  "photo-hotpot": {
    src: "./public/assets/image-pass-v1/playground-hotpot.webp",
    alt: "在火锅店拍下的一张照片。",
    width: 1100,
    height: 1100,
    treatment: "under-interface",
  },
  "photo-cat": {
    src: "./public/assets/image-pass-v1/playground-staring-cat.webp",
    alt: "一只正瞪着镜头的傻乎乎猫猫。",
    width: 1200,
    height: 1600,
    treatment: "side-crop",
  },
  "photo-kankan-ip": {
    src: "./public/assets/image-pass-v1/playground-kankan-ip.webp",
    alt: "Kankan 早期个人 IP 偘子的缅因小毛球。",
    width: 240,
    height: 240,
    treatment: "tiny-subject",
  },
  "photo-childhood-01": {
    src: "./public/assets/image-pass-v1/playground-childhood-meme-01.webp",
    alt: "另一张由 Kankan 小时候照片做成的表情包。",
    width: 900,
    height: 900,
    treatment: "edge-memory",
  },
};

const DAILY_EVENT_LIMIT = 9;
const DAILY_PLAY_KEY = "kankan-playground-daily-v1";
const persistedPlayState = readPlayState();

let pressCount = 0;
let pressResetTimer;
let eventTimer;
let fallbackTimer;
let triggerPositionIndex = 0;
let eventCount = persistedPlayState.total;
let dailyEventCount = persistedPlayState.date === todayKey() ? persistedPlayState.count : 0;
let dailyImageCount = persistedPlayState.date === todayKey() ? persistedPlayState.imageCount : 0;
let firstEventSeen = eventCount > 0;
let lastKind = null;
let lastWasLong = false;
let recentEvents = [];
let usedOnce = new Set(persistedPlayState.usedOnce);
let circleProgress = 0;
let circleProgressEventCount = -1;
let playtimeOverShown = false;
let activePhotoDiscovery = null;

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function todayKey() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

function readPlayState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DAILY_PLAY_KEY) || "null");
    if (!parsed || typeof parsed !== "object") throw new Error("empty state");
    return {
      date: typeof parsed.date === "string" ? parsed.date : todayKey(),
      count: Number.isFinite(parsed.count) ? Math.max(0, parsed.count) : 0,
      total: Number.isFinite(parsed.total) ? Math.max(0, parsed.total) : 0,
      imageCount: Number.isFinite(parsed.imageCount) ? Math.max(0, parsed.imageCount) : 0,
      usedOnce: Array.isArray(parsed.usedOnce) ? parsed.usedOnce : [],
    };
  } catch {
    return { date: todayKey(), count: 0, total: 0, imageCount: 0, usedOnce: [] };
  }
}

function savePlayState() {
  try {
    window.localStorage.setItem(DAILY_PLAY_KEY, JSON.stringify({
      date: todayKey(),
      count: dailyEventCount,
      total: eventCount,
      imageCount: dailyImageCount,
      usedOnce: [...usedOnce],
    }));
  } catch {
    /* The Playground remains usable when storage is unavailable. */
  }
}

function recordDailyEvent(id) {
  dailyEventCount += 1;
  if (photoDiscoveries[id]) dailyImageCount += 1;
  savePlayState();
}

function clearEventTimers() {
  window.clearTimeout(eventTimer);
  window.clearTimeout(fallbackTimer);
}

function weightedChoice(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of items) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

function selectNextEvent() {
  if (!firstEventSeen) {
    firstEventSeen = true;
    eventCount += 1;
    recentEvents = ["rap"];
    lastKind = "thought";
    lastWasLong = true;
    return "rap";
  }

  let candidates = eventDefinitions.filter(
    (event) => event.min <= eventCount && !(event.once && usedOnce.has(event.id)),
  );

  if (dailyImageCount >= 3) {
    candidates = candidates.filter((event) => event.kind !== "image");
  }

  const sessionPosition = dailyEventCount + 1;
  if (sessionPosition <= 3) {
    const easyIds = new Set(["adulthood", "visual", "nothing", "photo-fortune", "photo-hotpot"]);
    const easyCandidates = candidates.filter((event) => easyIds.has(event.id));
    if (easyCandidates.length) candidates = easyCandidates;
  }

  const withoutRecent = candidates.filter((event) => !recentEvents.includes(event.id));
  if (withoutRecent.length >= 3) candidates = withoutRecent;

  if (lastWasLong) {
    const shorter = candidates.filter((event) => !event.long);
    if (shorter.length) candidates = shorter;
  }

  if (lastKind === "reflective") {
    const nonReflective = candidates.filter((event) => event.kind !== "reflective");
    if (nonReflective.length) candidates = nonReflective;
  }

  const overdueMessage = eventCount >= 8 && !lastWasLong
    ? candidates.find((event) => event.id === "message-18")
    : null;
  const overdueNote = eventCount >= 14 && !lastWasLong
    ? candidates.find((event) => event.id === "visitor-note")
    : null;
  const availableImages = candidates.filter((event) => event.kind === "image");
  const earnedMeta = sessionPosition >= 7
    ? candidates.find((event) => event.id === "meta-still-clicking")
    : null;
  const inviteImage = dailyImageCount === 0 && sessionPosition >= 5 && availableImages.length && Math.random() < 0.58
    ? weightedChoice(availableImages)
    : null;
  const selected = overdueMessage || overdueNote || inviteImage || earnedMeta || weightedChoice(candidates);
  eventCount += 1;
  recentEvents = [...recentEvents.slice(-2), selected.id];
  lastKind = selected.kind;
  lastWasLong = Boolean(selected.long);
  if (selected.once) usedOnce.add(selected.id);
  return selected.id;
}

function showTrigger() {
  if (dailyEventCount >= DAILY_EVENT_LIMIT) {
    eventTrigger.hidden = true;
    if (!playtimeOverShown) showPlaytimeOver();
    return;
  }

  triggerPositions.forEach((position) => eventTrigger.classList.remove(position));
  eventTrigger.classList.add(triggerPositions[triggerPositionIndex % triggerPositions.length]);
  triggerGlyph.textContent = triggerGlyphs[triggerPositionIndex % triggerGlyphs.length];
  triggerPositionIndex += 1;
  eventTrigger.hidden = false;

  if (circleProgress === 1 && eventCount > circleProgressEventCount) {
    quietMark.disabled = false;
    quietMark.classList.add("is-active");
  }
}

function hideTrigger() {
  eventTrigger.hidden = true;
}

function openStage(coordinate, variant = "default") {
  clearEventTimers();
  hideTrigger();
  stageVariants.forEach((name) => eventStage.classList.remove(name));
  if (variant !== "default") eventStage.classList.add(`event-stage--${variant}`);
  eventCoordinate.textContent = coordinate;
  eventStage.hidden = false;
  eventStage.inert = false;
  eventStage.setAttribute("aria-hidden", "false");
  field.classList.add("has-active-event");
  window.requestAnimationFrame(() => eventStage.classList.add("is-visible"));
}

function closeStage({ restoreFocus = false } = {}) {
  clearEventTimers();
  const closingPlaytimeSummary = eventStage.dataset.playtimeOver === "true";
  eventStage.classList.remove("is-visible");
  eventStage.setAttribute("aria-hidden", "true");
  eventStage.inert = true;
  field.classList.remove("has-active-event", "is-dimmed");
  window.setTimeout(() => {
    eventStage.hidden = true;
    stageVariants.forEach((name) => eventStage.classList.remove(name));
    eventBody.replaceChildren();
    delete eventStage.dataset.playtimeOver;
    if (!closingPlaytimeSummary) showTrigger();
    if (restoreFocus && !eventTrigger.hidden) eventTrigger.focus();
  }, 300);
}

function disableButtons(container, selected) {
  container.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
    button.classList.toggle("is-selected", button === selected);
  });
}

function createActions(labels, onSelect) {
  const actions = createElement("div", "event-actions");
  labels.forEach((label) => {
    const button = createElement("button", null, label);
    button.type = "button";
    button.addEventListener("click", () => onSelect(button, label, actions));
    actions.append(button);
  });
  return actions;
}

function createResult(label, text, stacked = false) {
  const result = createElement("div", `event-result${stacked ? " event-result--stacked" : ""}`);
  result.append(createElement("span", null, label), createElement("strong", null, text));
  return result;
}

function showResult(result) {
  result.classList.add("is-visible");
}

function renderQuestionEvent(key) {
  const events = {
    rap: {
      question: "秦始皇如果活到现在，会不会学 rap？",
      consequences: {
        会: "课程已报名。第一首 diss track 暂定名：《六合同风》。",
        不会: "课程取消。兵马俑暂时继续保持安静。",
      },
    },
    moon: {
      question: "如果外星人不小心把月亮拿走了，它需要赔一个吗？",
      consequences: {
        需要: "赔偿申请已提交。备用月亮正在排队。",
        不需要: "已确认。今晚先用路灯凑合一下。",
      },
    },
  };
  const event = events[key];
  openStage("QUESTIONS NOBODY ASKED / ACTION → CONSEQUENCE");

  const article = createElement("article", "question-event");
  const prompt = createElement("div", "question-event__prompt");
  prompt.append(
    createElement("p", null, "A RIDICULOUS PREMISE, TAKEN SERIOUSLY"),
    createElement("h2", null, event.question),
  );
  const choices = createElement("div", "question-event__choices");
  const answer = createElement("div", "question-event__answer");
  const answerLabel = createElement("span", null, "CONSEQUENCE");
  const answerText = createElement("strong", null, "");
  const answerStatus = createElement("small", null, "ACTION RECORDED");
  answer.append(answerLabel, answerText, answerStatus);

  Object.entries(event.consequences).forEach(([choice, consequence]) => {
    const button = createElement("button", null, choice);
    button.type = "button";
    button.addEventListener("click", () => {
      disableButtons(choices, button);
      answerText.textContent = consequence;
      article.classList.add("has-answer");
    });
    choices.append(button);
  });

  article.append(prompt, choices, answer);
  eventBody.replaceChildren(article);
}

function renderAdulthoodEvent() {
  openStage("ADULTHOOD STATUS / ???");
  const article = createElement("article", "adulthood-event");
  const choices = createElement("div", "adulthood-event__choices");
  const review = createElement("div", "adulthood-event__review");
  const reviewLabel = createElement("span", null, "APPLICATION / NOT SUBMITTED");
  const reviewResult = createElement("strong", null, "");
  review.append(reviewLabel, reviewResult);

  ["YES", "NOT REALLY"].forEach((choice) => {
    const button = createElement("button", null, choice);
    button.type = "button";
    button.addEventListener("click", () => {
      disableButtons(choices, button);
      article.classList.add("is-reviewing");
      reviewLabel.textContent = "REVIEWING APPLICATION...";
      eventTimer = window.setTimeout(() => {
        article.classList.remove("is-reviewing");
        reviewLabel.textContent = "APPLICATION REVIEWED";
        reviewResult.textContent = "今天可以暂时不用。";
        eventTimer = window.setTimeout(() => closeStage(), 2600);
      }, 720);
    });
    choices.append(button);
  });
  article.append(createElement("h2", null, "今天要当大人吗？"), choices, review);
  eventBody.replaceChildren(article);
}

function renderSimpleChoice({ coordinate, variant, prompt, detail, choices, resultLabel, resultText, autoClose, resultWhen }) {
  openStage(coordinate, variant);
  const article = createElement("article", "event-copy");
  const heading = createElement("h2", null, prompt);
  if (detail) article.append(createElement("p", "event-copy__detail", detail));
  const result = createResult(resultLabel, resultText, true);
  const actions = createActions(choices, (button, label, container) => {
    disableButtons(container, button);
    if (resultWhen && label !== resultWhen) {
      eventTimer = window.setTimeout(() => closeStage(), 500);
      return;
    }
    showResult(result);
    if (autoClose) eventTimer = window.setTimeout(() => closeStage(), autoClose);
  });
  article.prepend(heading);
  article.append(actions, result);
  eventBody.replaceChildren(article);
}

function renderAnimalEvent() {
  openStage("ANIMAL REVIEW SYSTEM / UNAUTHORIZED");
  const article = createElement("article", "animal-event");
  const rating = createElement("div", "star-rating");
  const followup = createElement("div", "animal-event__followup");
  const self = createElement("p", "animal-event__self");
  self.append(
    createElement("span", null, "KANKAN SELF-ASSESSMENT"),
    createElement("strong", null, "4.5 ★"),
    createElement("small", null, "0.5 星算谦虚一下。"),
  );
  const guess = createElement("div", "animal-event__guess");
  guess.append(createElement("span", null, "WHO LEFT THE BAD REVIEW?"));
  const animals = createElement("div", "animal-event__animals");
  const reasoning = createElement("p", "animal-event__reasoning");
  reasoning.append(
    createElement("span", null, "KANKAN / VERDICT"),
    document.createTextNode("金鱼。因为金鱼只有 7 秒的记忆，他们给别人恶评不会内耗。"),
  );

  const reviewForm = createElement("form", "animal-review-form");
  const reviewLabel = createElement("label", null, "WHY THIS ANIMAL?");
  reviewLabel.htmlFor = "animal-review-reason";
  reviewLabel.append(createElement("span", null, "替它说两句。"));
  const reviewInput = createElement("input");
  reviewInput.id = "animal-review-reason";
  reviewInput.name = "animal-review-reason";
  reviewInput.type = "text";
  reviewInput.maxLength = 80;
  reviewInput.autocomplete = "off";
  reviewInput.placeholder = "它可能会说……";
  const reviewSubmit = createElement("button", null, "FILE REVIEW");
  reviewSubmit.type = "submit";
  const reviewFeedback = createElement("p", "animal-review-feedback");
  reviewFeedback.setAttribute("aria-live", "polite");
  reviewForm.append(reviewLabel, reviewInput, reviewSubmit, reviewFeedback);

  [1, 2, 3, 4, 5].forEach((value) => {
    const button = createElement("button", null, "★");
    button.type = "button";
    button.setAttribute("aria-label", `${value} 星`);
    button.addEventListener("click", () => {
      disableButtons(rating, button);
      followup.classList.add("is-visible");
    });
    rating.append(button);
  });

  ["猫", "狗", "鸟", "金鱼"].forEach((animal) => {
    const button = createElement("button", null, animal);
    button.type = "button";
    button.addEventListener("click", () => {
      disableButtons(animals, button);
      reasoning.classList.add("is-visible");
      reviewForm.classList.add("is-visible");
      reviewInput.placeholder = `替${animal}说两句……`;
      window.setTimeout(() => reviewInput.focus(), 120);
    });
    animals.append(button);
  });

  reviewForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!reviewInput.value.trim()) {
      reviewInput.focus();
      return;
    }
    reviewInput.disabled = true;
    reviewSubmit.disabled = true;
    reviewFeedback.textContent = "REVIEW FILED. ANIMAL NOTIFIED.";
  });

  guess.append(animals);
  followup.append(self, guess, reasoning, reviewForm);
  article.append(
    createElement("h2", null, "如果所有动物都可以给人类打分，你觉得偘偘现在几星？"),
    rating,
    followup,
  );
  eventBody.replaceChildren(article);
}

function renderCatEvent() {
  openStage("PREMISE CHECK / CAT", "edge");
  const article = createElement("article", "event-copy cat-event");
  const speech = createElement("blockquote", "cat-event__speech", "你有时候真的挺烦的。");
  const response = createElement("div", "cat-event__response");
  response.append(
    createElement("span", null, "KANKAN / FIRST THOUGHT"),
    createElement("strong", null, "我今天是不是起猛了，看到猫猫说话了？"),
    createElement("p", null, "是你会说人话了，还是我开始懂喵语了？"),
  );
  const actions = createActions(["？？？", "猫猫你再说一遍"], (button, _label, container) => {
    disableButtons(container, button);
    response.classList.add("is-visible");
  });
  article.append(
    createElement("p", "event-copy__coordinate", "THE CAT HAS SOMETHING TO SAY"),
    speech,
    actions,
    response,
  );
  eventBody.replaceChildren(article);
}

function renderLifeChangeEvent() {
  openStage("CHANGE REQUEST / SCOPE UNKNOWN", "system");
  const article = createElement("article", "event-copy");
  article.append(
    createElement("h2", null, "按下以后，你的人生会发生一点变化。"),
  );
  const waitResult = createResult("EXECUTION", "WAIT.");
  const scope = createElement("section", "decision-scope");
  scope.append(createElement("span", null, "SECOND LAYER / WHO COULD THIS AFFECT?"));
  const protocol = createResult("KANKAN / PROTOCOL", "", true);
  const scopeActions = createActions(["只影响我", "可能影响别人"], (button, label, container) => {
    disableButtons(container, button);
    protocol.querySelector("strong").textContent = label === "只影响我"
      ? "如果确认只影响我，会按。"
      : "如果对其他人不确定，或者确定有影响，不按。";
    showResult(protocol);
  });
  scope.append(scopeActions, protocol);
  const actions = createActions(["PRESS", "LEAVE IT"], (button, label, container) => {
    disableButtons(container, button);
    if (label === "LEAVE IT") {
      eventTimer = window.setTimeout(() => closeStage(), 450);
      return;
    }
    showResult(waitResult);
    eventTimer = window.setTimeout(() => {
      waitResult.classList.remove("is-visible");
      scope.classList.add("is-visible");
    }, 680);
  });
  article.append(actions, waitResult, scope);
  eventBody.replaceChildren(article);
}

function renderRenameEvent() {
  openStage("OBJECT NAME REGISTRY / UNVERIFIED", "edge");
  const article = createElement("article", "event-copy");
  article.append(
    createElement("h2", null, "你的桌子告诉你，它叫王建国。"),
    createElement("p", "event-copy__detail", "世界上所有东西其实都有自己的名字。"),
  );
  const result = createResult("STATUS", "", true);
  const actions = createActions(["ACCEPT NAME", "REQUEST RENAME"], (button, label, container) => {
    disableButtons(container, button);
    showResult(result);
    const status = result.querySelector("span");
    const response = result.querySelector("strong");
    if (label === "ACCEPT NAME") {
      status.textContent = "REGISTRY UPDATED";
      response.textContent = "登记成功。\n王建国对这个结果表示满意。";
      return;
    }
    status.textContent = "RENAME REQUEST / PROCESSING";
    response.textContent = "";
    eventTimer = window.setTimeout(() => {
      status.textContent = "REQUEST REJECTED";
      response.textContent = "申请已提交。\n王建国拒绝改名。";
    }, 620);
  });
  article.append(actions, result);
  eventBody.replaceChildren(article);
}

function renderBehaviorEvent() {
  openStage("BEHAVIOR DETECTED", "edge");
  const article = createElement("article", "event-copy");
  const result = createResult("RECORD", "", true);
  const actions = createActions(["没有", "是"], (button, label, container) => {
    disableButtons(container, button);
    result.querySelector("strong").textContent = label === "没有" ? "记录显示不是。" : "知道了。继续吧。";
    showResult(result);
    eventTimer = window.setTimeout(() => closeStage(), 2200);
  });
  article.append(createElement("h2", null, "你是不是很喜欢乱点东西。"), actions, result);
  eventBody.replaceChildren(article);
}

function renderMetaStillClicking() {
  openStage("BEHAVIOR DETECTED", "edge");
  const article = createElement("article", "event-copy meta-event");
  article.append(
    createElement("p", "event-copy__coordinate", "SESSION OBSERVATION / UNREQUESTED"),
    createElement("h2", null, "你怎么还在点。"),
    createElement("small", null, "没有要阻止你的意思。"),
  );
  eventBody.replaceChildren(article);
  eventTimer = window.setTimeout(() => closeStage(), 2100);
}

function closePhotoDiscovery({ restoreFocus = false } = {}) {
  if (!activePhotoDiscovery) return;
  const discovery = activePhotoDiscovery;
  activePhotoDiscovery = null;
  discovery.classList.add("is-leaving");
  window.setTimeout(() => discovery.remove(), 300);
  showTrigger();
  if (restoreFocus && !eventTrigger.hidden) eventTrigger.focus();
}

function renderPhotoDiscovery(id) {
  const discoveryData = photoDiscoveries[id];
  if (!discoveryData) return showTinyResponse("没找到。", 900);

  hideTrigger();
  if (activePhotoDiscovery) activePhotoDiscovery.remove();

  const discovery = createElement(
    "figure",
    `photo-discovery photo-discovery--${discoveryData.treatment}`,
  );
  discovery.setAttribute("role", "dialog");
  discovery.setAttribute("aria-label", "突然出现的一张照片");

  const image = createElement("img");
  image.src = discoveryData.src;
  image.alt = discoveryData.alt;
  image.width = discoveryData.width;
  image.height = discoveryData.height;
  image.decoding = "async";

  const closeButton = createElement("button", "photo-discovery__close", "CLOSE ×");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "收起这张照片");
  closeButton.addEventListener("click", () => closePhotoDiscovery({ restoreFocus: true }));

  image.addEventListener("error", () => closePhotoDiscovery());
  discovery.append(image, closeButton);
  field.append(discovery);
  activePhotoDiscovery = discovery;
  window.requestAnimationFrame(() => discovery.classList.add("is-visible"));
  closeButton.focus({ preventScroll: true });
}

function renderEvent(id) {
  if (photoDiscoveries[id]) return renderPhotoDiscovery(id);
  if (id === "rap" || id === "moon") return renderQuestionEvent(id);
  if (id === "adulthood") return renderAdulthoodEvent();
  if (id === "animal") return renderAnimalEvent();
  if (id === "cat") return renderCatEvent();
  if (id === "duplicate") {
    return renderSimpleChoice({
      coordinate: "DUPLICATION ERROR",
      prompt: "家里突然出现了一个完全复制版的你。",
      detail: "长相一样。记忆一样。性格一样。今晚只有一张床。",
      choices: ["我睡床", "让她睡", "石头剪刀布"],
      resultLabel: "KANKAN'S SOLUTION",
      resultText: "挤一挤更开心。",
    });
  }
  if (id === "life-change") return renderLifeChangeEvent();
  if (id === "ctrl-z") return visitorTraces.renderCtrlZ();
  if (id === "rename") return renderRenameEvent();
  if (id === "ghost") {
    field.classList.add("is-dimmed");
    return renderSimpleChoice({
      coordinate: "03:00 AM",
      variant: "edge",
      prompt: "冰箱门开了，里面站着一只鬼。",
      choices: ["问它在干嘛", "假装没看到"],
      resultLabel: "KANKAN / 03:00 AM",
      resultText: "它为什么开冰箱哈哈。\n有想吃的东西要不一起？",
      autoClose: 2800,
    });
  }
  if (id === "behavior") return renderBehaviorEvent();
  if (id === "meta-still-clicking") return renderMetaStillClicking();
  if (id === "message-18") return visitorTraces.renderMessage18();
  if (id === "visitor-note") return visitorTraces.renderBeforeYouGo();
  if (id === "age-18") {
    return renderSimpleChoice({
      coordinate: "TEN MINUTES / AGE 18",
      variant: "quiet",
      prompt: "你回到18岁，只能待十分钟。",
      detail: "她不知道你是谁。",
      choices: ["跟她说话", "偷偷看看她"],
      resultLabel: "KANKAN / B",
      resultText: "偷偷看看她。",
      autoClose: 3200,
    });
  }
  if (id === "circle") return startCircleEvent();
  if (id === "thanks") return showTinyResponse("谢谢。", 1300);
  if (id === "nothing") return showTinyResponse("没东西。", 900);
  return showVisualEvent();
}

function positionTinyResponse() {
  const triggerRect = eventTrigger.getBoundingClientRect();
  const fieldRect = field.getBoundingClientRect();
  nonEvent.style.left = `${triggerRect.left - fieldRect.left + triggerRect.width / 2}px`;
  nonEvent.style.top = `${triggerRect.top - fieldRect.top + triggerRect.height / 2}px`;
}

function showTinyResponse(text, duration) {
  positionTinyResponse();
  hideTrigger();
  nonEvent.textContent = text;
  nonEvent.hidden = false;
  window.requestAnimationFrame(() => nonEvent.classList.add("is-visible"));
  eventTimer = window.setTimeout(() => {
    nonEvent.classList.remove("is-visible");
    window.setTimeout(() => {
      nonEvent.hidden = true;
      nonEvent.textContent = "";
      showTrigger();
    }, 220);
  }, duration);
}

function showVisualEvent() {
  hideTrigger();
  quietMark.textContent = "◌";
  field.classList.add("is-visually-surprised");
  eventTimer = window.setTimeout(() => {
    field.classList.remove("is-visually-surprised");
    quietMark.textContent = circleProgress === 0 ? "○" : circleProgress === 1 ? "◉" : "●";
    showTrigger();
  }, 1050);
}

function finishCircleEvent() {
  window.clearTimeout(fallbackTimer);
  quietMark.disabled = true;
  quietMark.classList.remove("is-active");
  showTrigger();
}

function startCircleEvent() {
  hideTrigger();
  quietMark.textContent = circleProgress === 0 ? "○" : "◉";
  quietMark.disabled = false;
  quietMark.classList.add("is-active");
  fallbackTimer = window.setTimeout(finishCircleEvent, 10000);
}

function showPlaytimeOver() {
  if (playtimeOverShown) return;
  playtimeOverShown = true;
  openStage("DAILY LIMIT / 9 OF 9", "quiet");
  eventStage.dataset.playtimeOver = "true";
  const article = createElement("article", "playtime-over");
  article.append(
    createElement("h2", null, "TODAY'S PLAYTIME IS OVER."),
    createElement("p", null, "今天真的玩够了。\n明天再来，可能不是这些。"),
    createElement("small", null, "9 / 9 STRANGE THINGS FOUND"),
  );
  eventBody.replaceChildren(article);
}

function runEvent() {
  clearEventTimers();
  if (dailyEventCount >= DAILY_EVENT_LIMIT) {
    showPlaytimeOver();
    return;
  }
  const id = selectNextEvent();
  recordDailyEvent(id);
  renderEvent(id);
}

pressButton.addEventListener("click", () => {
  if (pressCount >= pressMessages.length) return;
  window.clearTimeout(pressResetTimer);
  pressCount += 1;
  pressResponse.textContent = pressMessages[pressCount - 1];
  if (pressCount === 1 && eventTrigger.hidden) {
    window.setTimeout(showTrigger, 380);
    window.setTimeout(visitorTraces.revealTraceControl, 900);
    window.setTimeout(visitorTraces.revealMessageEntrance, 1150);
  }
  if (pressCount !== pressMessages.length) return;
  field.classList.add("is-visually-surprised");
  const previousQuietMark = quietMark.textContent;
  quietMark.textContent = "◉";
  window.setTimeout(() => {
    pressResponse.textContent = "行吧。算你赢。";
  }, 140);
  pressResetTimer = window.setTimeout(() => {
    pressCount = 0;
    pressResponse.textContent = "";
    quietMark.textContent = previousQuietMark;
    field.classList.remove("is-visually-surprised");
  }, 2140);
});

eventTrigger.addEventListener("click", runEvent);
eventClose.addEventListener("click", () => closeStage({ restoreFocus: true }));
quietMark.addEventListener("click", () => {
  if (!quietMark.classList.contains("is-active")) return;
  window.clearTimeout(fallbackTimer);
  circleProgress += 1;
  quietMark.textContent = circleProgress === 1 ? "◉" : "●";
  quietMark.disabled = true;
  quietMark.classList.remove("is-active");

  if (circleProgress === 1) {
    circleProgressEventCount = eventCount;
    showTrigger();
    return;
  }

  hideTrigger();
  window.clearTimeout(fallbackTimer);
  nonEvent.textContent = "好了，填满了。";
  nonEvent.style.left = "78%";
  nonEvent.style.top = "42%";
  nonEvent.hidden = false;
  nonEvent.classList.add("is-visible");
  eventTimer = window.setTimeout(() => {
    nonEvent.classList.remove("is-visible");
    nonEvent.hidden = true;
    nonEvent.textContent = "";
    showTrigger();
  }, 1800);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activePhotoDiscovery) {
    closePhotoDiscovery({ restoreFocus: true });
    return;
  }
  if (event.key === "Escape" && eventStage.classList.contains("is-visible")) {
    closeStage({ restoreFocus: true });
  }
});
