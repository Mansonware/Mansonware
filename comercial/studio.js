"use strict";

const byId = (id) => document.getElementById(id);
const service = byId("service");
const quantity = byId("quantity");
const price = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const questions = {
  landing: "O que você quer divulgar?",
  premium: "Qual oferta merece destaque?",
  site: "Quais serviços sua empresa oferece?",
  catalogo: "Quais produtos vão entrar no catálogo?",
  loja: "Que produtos você pretende vender?",
  bot: "Quais dúvidas chegam ao WhatsApp?",
  ia: "Que tarefa você gostaria de automatizar?",
  saas: "Que processo o sistema deve resolver?",
  ajuda: "O que você gostaria de facilitar para o seu cliente?",
};

function updateEstimate(event) {
  const base = Number(service.selectedOptions[0].dataset.base);
  byId("qty-field").hidden = !base;
  byId("estimate").textContent = base
    ? "A partir de " + price.format(base * Number(quantity.value))
    : "Sob consulta";
  if (
    event?.type === "change" &&
    !motion.matches &&
    typeof service.animate === "function"
  ) {
    animateElement(
      byId("estimate"),
      [
        { transform: "translateY(4px)", opacity: 0.5 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 220 },
    );
  }
  byId("goal-label").firstChild.textContent = questions[service.value] + " ";
}
service.addEventListener("change", updateEstimate);
quantity.addEventListener("change", updateEstimate);
window.addEventListener("pageshow", updateEstimate);

function selectService(value) {
  service.value = value;
  quantity.value = "1";
  updateEstimate();
}
document.querySelectorAll("[data-service]").forEach((link) => {
  link.addEventListener("click", () => selectService(link.dataset.service));
});

const who = byId("who");

byId("brief").addEventListener("submit", (event) => {
  event.preventDefault();
  const segment = byId("segment").value.trim();
  const goal = byId("objective").value.trim();
  const lines = [
    "Olá, Manson! " +
      (who.value.trim() ? "Sou " + who.value.trim() + ". " : "") +
      "Vim pelo site da Mansonware.",
    "Projeto: " + service.selectedOptions[0].label,
    byId("qty-field").hidden ? "" : "Quantidade: " + quantity.value,
    "Estimativa inicial: " + byId("estimate").textContent,
    segment && "Segmento: " + segment,
    goal && "Objetivo: " + goal,
    "Podemos conversar sobre o escopo e o valor final?",
  ];
  const url = new URL("https://wa.me/5512996335539");
  url.searchParams.set("text", lines.filter(Boolean).join("\n"));
  countAction("brief");
  window.location.assign(url.href);
});
document.querySelectorAll("[data-direct]").forEach((link) => {
  link.addEventListener("click", () => countAction("direct"));
});

// Only these fixed path tokens are sent. The browser preference contains no visitor ID.
const collector = document.querySelector(
  'meta[name="metrics-endpoint"]',
)?.content;
const consent = byId("consent");
const optOut =
  navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
const prefKey = "mw-metricas";
let measuredVisit = false;
try {
  consent.checked = !optOut && localStorage.getItem(prefKey) === "sim";
} catch {
  /* storage unavailable */
}
consent.disabled = optOut || !collector;
if (optOut)
  byId("privacy-status").textContent =
    "Medição desativada pela preferência do navegador.";
else if (!collector)
  byId("privacy-status").textContent =
    "A medição está desativada nesta versão.";
function countAction(action) {
  if (
    consent.disabled ||
    !consent.checked ||
    !["visit", "direct", "brief"].includes(action)
  )
    return;
  fetch(collector + "/" + action, {
    method: "POST",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
  }).catch(() => {}); // Delivery must never delay the visitor's next action.
}
function countVisit() {
  if (!measuredVisit && !consent.disabled && consent.checked) {
    measuredVisit = true;
    countAction("visit");
  }
}
consent.addEventListener("change", () => {
  try {
    if (consent.checked) localStorage.setItem(prefKey, "sim");
    else localStorage.removeItem(prefKey);
  } catch {
    /* preference applies to this page only */
  }
  byId("privacy-status").textContent = consent.checked
    ? "Contagem permitida neste navegador."
    : "Contagem desativada.";
  countVisit();
});
countVisit();

// Play the catalogue journey once when visible. Its resting state is also the no-JS view.
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const journey = document.querySelector(".journey");
const replay = byId("play-journey");
const effects = new Set();
function animateElement(element, frames, timing) {
  const effect = element.animate(frames, timing);
  effects.add(effect);
  effect.finished.then(
    () => effects.delete(effect),
    () => effects.delete(effect),
  );
}
function playJourney() {
  if (motion.matches) return;
  for (const item of journey.getAnimations({ subtree: true })) item.cancel();
  const entrance = [
    { opacity: 0, transform: "translateY(16px) scale(.97)" },
    { opacity: 1, transform: "none" },
  ];
  animateElement(journey.querySelector(".product-screen"), entrance, {
    duration: 650,
    easing: "ease-out",
  });
  animateElement(
    journey.querySelector(".sample-add"),
    [
      { transform: "scale(1)" },
      { transform: "scale(1.3)", background: "#956042" },
      { transform: "scale(1)" },
    ],
    { duration: 520, delay: 1050 },
  );
  animateElement(journey.querySelector(".order-bubble"), entrance, {
    duration: 620,
    delay: 1580,
    fill: "backwards",
    easing: "cubic-bezier(.16,1,.3,1)",
  });
}
if ("IntersectionObserver" in window && typeof journey.animate === "function") {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (motion.matches) continue;
        if (entry.target === journey) playJourney();
        else {
          entry.target.classList.add("entered");
          animateElement(
            entry.target,
            [
              { opacity: 0.35, transform: "translateY(14px)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: 420, easing: "ease-out" },
          );
        }
      }
    },
    { threshold: 0.15 },
  );
  const syncMotion = () => {
    observer.disconnect();
    for (const effect of effects) effect.cancel();
    replay.hidden = motion.matches;
    if (!motion.matches) {
      observer.observe(journey);
      document
        .querySelectorAll(".section-head, .tile, .rate-heading, .brief")
        .forEach((element) => observer.observe(element));
    }
  };
  replay.addEventListener("click", playJourney);
  motion.addEventListener("change", syncMotion);
  syncMotion();
}
