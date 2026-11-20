"use strict";

const byId = (id) => document.getElementById(id);
const service = byId("service");
const quantity = byId("quantity");
const price = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const foodMode = document.documentElement.dataset.para === "lanchonete";
const foodPriceLines = [...byId("food-price").children];
const foodPrice = foodPriceLines.map((line) => line.textContent).join(" ");
const originText = foodMode
  ? "Vim pelo link para lanchonetes."
  : "Vim pelo site da Mansonware.";
if (foodMode) {
  const option = new Option(
    byId("food-title").textContent.trim(),
    "cardapio",
    true,
    true,
  );
  service.querySelector('[value="catalogo"]').remove();
  service.prepend(option);
  service.value = option.value;
  byId("objective").placeholder =
    "Ex.: os pedidos chegam bagunçados no WhatsApp";
  byId("hero-quote").dataset.service = option.value;
  document
    .querySelectorAll('#experimente [data-service="catalogo"]')
    .forEach((link) => (link.dataset.service = option.value));
  const direct = new URL("https://wa.me/5512996335539");
  direct.searchParams.set(
    "text",
    "Olá, Manson! " +
      originText +
      " Quero saber sobre o cardápio digital (" +
      foodPrice +
      ").",
  );
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach((link) => {
    link.href = direct.href;
  });
}
function updateEstimate(event) {
  const base = Number(service.selectedOptions[0].dataset.base);
  const count = foodMode ? 1 : Number(quantity.value);
  byId("qty-field").hidden = foodMode || !base;
  const fixedPrice = service.value === "cardapio";
  byId("estimate-label").textContent = fixedPrice
    ? "Valores"
    : "Estimativa inicial";
  if (fixedPrice) {
    byId("estimate").replaceChildren(
      ...foodPriceLines.map((line) => line.cloneNode(true)),
    );
  } else {
    byId("estimate").textContent = base
      ? "A partir de " + price.format(base * count)
      : "Sob consulta";
  }
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
}
service.addEventListener("change", updateEstimate);
quantity.addEventListener("change", updateEstimate);
updateEstimate();
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

// Last demo the visitor tried in #experimente (set by demos.js or a demo CTA).
let testedDemo = "";
document.addEventListener("demo:tested", (event) => {
  testedDemo = event.detail;
});
document.querySelectorAll("[data-demo]").forEach((link) => {
  link.addEventListener("click", () => (testedDemo = link.dataset.demo));
});

byId("brief").addEventListener("submit", (event) => {
  event.preventDefault();
  const segment = byId("segment").value.trim();
  const goal = byId("objective").value.trim();
  const lines = [
    "Olá, Manson! " +
      (who.value.trim() ? "Sou " + who.value.trim() + ". " : "") +
      originText,
    testedDemo && "Testei a demonstração: " + testedDemo + ".",
    "Projeto: " + service.selectedOptions[0].label,
    !byId("qty-field").hidden &&
      Number(quantity.value) > 1 &&
      "Quantidade: " + quantity.value,
    service.value === "cardapio"
      ? "Valores: " + foodPrice
      : "Estimativa inicial: " + byId("estimate").textContent,
    segment && "Segmento: " + segment,
    goal && "O que quero resolver: " + goal,
    service.value === "cardapio"
      ? "Podemos conversar?"
      : "Podemos conversar sobre o escopo e o valor final?",
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
