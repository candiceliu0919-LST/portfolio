import { visitorTracesPrototypeData } from "../data/visitor-traces-mock.js?rev=01";

function make(tagName, className, text) {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function lockButtons(container, selected) {
  container.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
    button.classList.toggle("is-selected", button === selected);
  });
}

export function createVisitorTraces({ eventBody, openStage, closeStage, onBeforeYouGoOpen }) {
  const traceControl = document.querySelector("[data-trace-control]");
  const tracePrompt = document.querySelector("[data-trace-prompt]");
  const tracePicker = document.querySelector("[data-trace-picker]");
  const traceLayer = document.querySelector("[data-trace-layer]");
  const traceStatus = document.querySelector("[data-trace-status]");
  const messageEntrance = document.querySelector("[data-message-entrance]");

  let tracePosition = 0;
  let noteIndex = 0;
  const leftNotes = [];

  function revealTraceControl() {
    if (!traceControl.hidden) return;
    traceControl.hidden = false;
    window.requestAnimationFrame(() => traceControl.classList.add("is-visible"));
  }

  function revealMessageEntrance() {
    if (!messageEntrance.hidden) return;
    messageEntrance.hidden = false;
    window.requestAnimationFrame(() => messageEntrance.classList.add("is-visible"));
  }

  function leaveSymbol(mark) {
    const trace = make("span", `visitor-mark visitor-mark--${tracePosition % 5}`, mark);
    trace.setAttribute("aria-hidden", "true");
    traceLayer.append(trace);
    tracePosition += 1;

    tracePicker.hidden = true;
    tracePrompt.setAttribute("aria-expanded", "false");
    tracePrompt.textContent = "TRACE LEFT.";
    tracePrompt.disabled = true;
    traceStatus.textContent = "知道了。";
    window.setTimeout(() => {
      traceStatus.textContent = "";
    }, 1800);
  }

  tracePrompt.addEventListener("click", () => {
    tracePicker.hidden = !tracePicker.hidden;
    tracePrompt.setAttribute("aria-expanded", String(!tracePicker.hidden));
  });

  tracePicker.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => leaveSymbol(button.dataset.traceMark));
  });

  messageEntrance.addEventListener("click", () => {
    onBeforeYouGoOpen?.();
    renderBeforeYouGo();
  });

  function makeKankanAside(text) {
    const aside = make("aside", "collective-fragment__aside");
    aside.append(
      make("span", null, "KANKAN WAS HERE TOO"),
      make("p", null, text),
    );
    return aside;
  }

  function renderCollective(article) {
    article.replaceChildren();
    article.className = "visitor-note-event visitor-note-event--collective";

    const heading = make("header", "collective-heading");
    heading.append(make("span", null, "MORE PEOPLE WERE HERE"));

    const fieldOfNotes = make("div", "collective-field");
    const notes = [...visitorTracesPrototypeData.singleNotes];
    leftNotes.forEach((text) => notes.unshift({ text: "我眼里的偘偘是 " + text, isOwn: true }));
    notes.slice(0, 6).forEach((note, index) => {
      const fragment = make("article", `collective-fragment collective-fragment--${index % 6}`);
      fragment.dataset.prototypeMock = note.isOwn ? "false" : "true";
      fragment.append(make("p", null, note.text));
      if (note.kankan) fragment.append(makeKankanAside(note.kankan));
      fieldOfNotes.append(fragment);
    });

    const back = make("button", "collective-back", "← ONE PERSON");
    back.type = "button";
    back.addEventListener("click", () => renderEncounter(article));
    article.append(heading, fieldOfNotes, back);
  }

  function renderEncounter(article, ownText = "") {
    article.replaceChildren();
    article.className = "visitor-note-event visitor-note-event--encounter";

    if (ownText) {
      const own = make("div", "visitor-note-own");
      const sentence = make("p");
      sentence.append(
        document.createTextNode("我眼里的偘偘是 "),
        make("strong", null, ownText),
      );
      own.append(sentence, make("span", null, "YOU LEFT → ARCHIVED"));
      article.append(own);
    }

    const stranger = make("section", "stranger-note");
    const label = make("span", null, "SOMEONE ELSE LEFT THIS");
    const quote = make("blockquote", null, visitorTracesPrototypeData.singleNotes[noteIndex].text);
    const controls = make("div", "stranger-note__controls");
    const another = make("button", null, "再捡一张 →");
    another.setAttribute("aria-label", "PICK UP ANOTHER NOTE");
    const more = make("button", null, "MORE PEOPLE WERE HERE →");
    more.className = "stranger-note__more";
    more.hidden = true;

    another.type = "button";
    another.addEventListener("click", () => {
      another.disabled = true;
      quote.classList.remove("is-entering");
      quote.classList.add("is-leaving");
      window.setTimeout(() => {
        noteIndex = (noteIndex + 1) % visitorTracesPrototypeData.singleNotes.length;
        quote.textContent = visitorTracesPrototypeData.singleNotes[noteIndex].text;
        quote.classList.remove("is-leaving");
        quote.classList.add("is-entering");
        another.disabled = false;
        more.hidden = false;
      }, 420);
    });
    more.type = "button";
    more.addEventListener("click", () => renderCollective(article));
    controls.append(another, more);
    stranger.append(label, quote, controls);
    article.append(stranger);
  }

  function renderBeforeYouGo() {
    openStage("BEFORE YOU GO / ONE THING", "quiet");
    const article = make("article", "visitor-note-event visitor-note-event--input");
    const intro = make("header", "visitor-note-intro");
    intro.append(
      make("span", null, "ONE ANONYMOUS SENTENCE"),
      make("h2", null, "我眼里的偘偘是"),
    );

    const form = make("form", "visitor-note-form");
    const label = make("label", "sr-only", "留给偘偘的一句话");
    label.htmlFor = "visitor-note-input";
    const input = make("input");
    input.id = "visitor-note-input";
    input.name = "visitor-note";
    input.type = "text";
    input.maxLength = 48;
    input.autocomplete = "off";
    input.placeholder = "______。";
    const leave = make("button", null, "LEAVE IT HERE");
    leave.type = "submit";
    form.append(label, input, leave);

    const read = make("button", "visitor-note-read", "OR READ WHAT SOMEONE LEFT →");
    read.type = "button";
    read.addEventListener("click", () => renderEncounter(article));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) {
        input.focus();
        return;
      }
      leftNotes.push(value);
      renderEncounter(article, value);
    });

    article.append(intro, form, read);
    eventBody.replaceChildren(article);
    window.setTimeout(() => input.focus(), 420);
  }

  function renderMessage18() {
    openStage("MESSAGE / AGE 18");
    const article = make("article", "message-18-event");
    article.append(make("h2", null, "选一个你想寄给 18 岁自己的 emoji。"));

    const emojiField = make("div", "message-18__choices");
    ["🫂", "🔥", "😭", "❤️", "🌱", "🫡"].forEach((emoji) => {
      const button = make("button", null, emoji);
      button.type = "button";
      button.setAttribute("aria-label", `发送 ${emoji}`);
      button.addEventListener("click", () => {
        lockButtons(emojiField, button);
        revealMessage18Result(article, emoji);
      });
      emojiField.append(button);
    });
    article.append(emojiField);
    eventBody.replaceChildren(article);
  }

  function revealMessage18Result(article, visitorEmoji) {
    article.classList.add("has-message");
    const result = make("section", "message-18__result");
    const you = make("div", "message-18__message");
    you.append(make("span", null, "YOU → 18"), make("strong", null, visitorEmoji));
    const kankan = make("div", "message-18__message message-18__message--missing");
    kankan.append(
      make("span", null, "KANKAN → 18"),
      make("strong", null, "🉑"),
      make("p", null, "如果是高考前看到这个，会更心安一些。"),
    );

    const consent = make("div", "message-18__consent");
    consent.append(make("span", null, "LEAVE IT HERE?"));
    const actions = make("div", "message-18__actions");
    ["YES", "NO"].forEach((label) => {
      const button = make("button", null, label);
      button.type = "button";
      button.addEventListener("click", () => {
        lockButtons(actions, button);
        if (label === "YES") revealSharedEmoji(consent, visitorEmoji);
        else consent.append(make("p", "message-18__not-left", "没有留下。"));
      });
      actions.append(button);
    });
    consent.append(actions);
    result.append(you, kankan, consent);
    article.append(result);
  }

  function revealSharedEmoji(consent, visitorEmoji) {
    const shared = make("section", "message-18__shared");
    shared.dataset.prototypeMock = "true";
    shared.append(make("span", null, "OTHERS SENT → 18"));
    const cloud = make("p");
    [visitorEmoji, ...visitorTracesPrototypeData.sharedAge18Emoji].forEach((emoji) => {
      cloud.append(make("span", null, emoji));
    });
    shared.append(cloud);
    consent.append(shared);
  }

  function renderCtrlZ() {
    openStage("TIMELINE CONTROL / ONE USE ONLY");
    const article = make("article", "event-copy ctrl-z-event");
    article.append(
      make("h2", null, "人生现在出现一个 CTRL + Z。"),
      make("p", "event-copy__detail", "可以撤销一个已经发生的选择。没有 CTRL + Y。"),
    );

    const result = make("div", "event-result event-result--stacked");
    result.append(
      make("span", null, "KANKAN / PRESS"),
      make("strong", null, "按。\n我想换个自己活试试，看看是个什么路数。"),
    );

    const actions = make("div", "event-actions");
    ["PRESS", "DON'T"].forEach((label) => {
      const button = make("button", null, label);
      button.type = "button";
      button.addEventListener("click", () => {
        lockButtons(actions, button);
        if (label === "DON'T") {
          window.setTimeout(() => closeStage(), 500);
          return;
        }
        result.classList.add("is-visible");
        window.setTimeout(() => revealPrivateQuestion(article), 650);
      });
      actions.append(button);
    });
    article.append(actions, result);
    eventBody.replaceChildren(article);
  }

  function revealPrivateQuestion(article) {
    const privateArea = make("section", "private-trace");
    privateArea.append(
      make("span", null, "AND YOU?"),
      make("h3", null, "如果真的按了，你最想换掉哪一个选择？"),
    );
    const form = make("form", "private-trace__form");
    const label = make("label", "sr-only", "只留给偘偘的回答");
    label.htmlFor = "private-trace-input";
    const input = make("input");
    input.id = "private-trace-input";
    input.type = "text";
    input.maxLength = 80;
    input.autocomplete = "off";
    const leave = make("button", null, "LEAVE IT HERE");
    leave.type = "submit";
    const decline = make("button", null, "不告诉你");
    decline.type = "button";
    form.append(label, input, leave, decline);
    privateArea.append(form, make("p", "private-trace__privacy", "只留给偘偘，不会进入公开痕迹。"));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!input.value.trim()) {
        input.focus();
        return;
      }
      privateArea.replaceChildren(
        make("strong", "private-trace__left", "LEFT HERE."),
        make("p", "private-trace__privacy", "只留给偘偘。"),
      );
    });
    decline.addEventListener("click", () => {
      privateArea.replaceChildren(make("p", "private-trace__declined", "不告诉就不告诉。"));
    });
    article.append(privateArea);
  }

  return {
    revealTraceControl,
    revealMessageEntrance,
    renderBeforeYouGo,
    renderMessage18,
    renderCtrlZ,
  };
}
