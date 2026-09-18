const lobby = document.querySelector("[data-lobby]");
const status = document.querySelector("[data-lobby-status]");
const witness = document.querySelector("[data-playground-witness]");
const worlds = [...document.querySelectorAll("[data-world]")];

const messages = {
  contradictions: "入口已选：两件互相冲突的事，可能都是真的。",
  keeping: "入口已选：这些东西先别扔。",
  manual: "入口已选：诊断完成度 17%。",
};

let resetTimer;
let playgroundTimer;

function resetSelection() {
  lobby?.classList.remove("is-choosing");
  worlds.forEach((world) => world.classList.remove("is-chosen"));
  status?.classList.remove("is-speaking");
}

function chooseWorld(world) {
  clearTimeout(resetTimer);
  lobby?.classList.add("is-choosing");
  worlds.forEach((candidate) => candidate.classList.toggle("is-chosen", candidate === world));
  status.textContent = messages[world.dataset.world];
  status.classList.add("is-speaking");
  resetTimer = window.setTimeout(resetSelection, 1550);
}

function pressPlayground(world) {
  clearTimeout(playgroundTimer);
  const label = world.querySelector(".playground-switch b");
  label.textContent = "TOO LATE";
  witness?.classList.add("is-visible");
  status.textContent = "它看见你了。没事，只是看见了。";
  status.classList.add("is-speaking");

  playgroundTimer = window.setTimeout(() => {
    window.location.href = "./playground.html?rev=consolidation-v1";
  }, 680);
}

worlds.forEach((world) => {
  world.addEventListener("click", () => {
    if (world.dataset.world === "playground") {
      pressPlayground(world);
      return;
    }

    if (world.dataset.world === "keeping") {
      window.location.href = "./things-worth-keeping.html";
      return;
    }

    if (world.dataset.world === "contradictions") {
      window.location.href = "./contradictions-allowed.html";
      return;
    }

    if (world.dataset.world === "manual") {
      window.location.href = "./kankan-user-manual.html";
      return;
    }
    chooseWorld(world);
  });
});
