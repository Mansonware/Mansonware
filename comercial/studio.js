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

function updateEstimate() {
  const base = Number(service.selectedOptions[0].dataset.base);
  byId("qty-field").hidden = !base;
  byId("estimate").textContent = base
    ? "A partir de " + price.format(base * Number(quantity.value))
    : "Sob consulta";
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

const demos = {
  forno: {
    sector: "gastronomia",
    brand: "Casa Forno",
    title: "Pizza de fermentação lenta.",
    description: "Escolha um sabor e veja o resumo do pedido.",
    label: "Sabor da pizza",
    options: ["Margherita", "Quatro queijos", "Calabresa"],
    action: "Montar pedido",
    result: "Pedido de exemplo: 1 pizza",
    alt: "Pizza margherita com manjericão",
    service: "catalogo",
  },
  pousada: {
    sector: "hospedagem",
    brand: "Refúgio da Serra",
    title: "Uma pausa entre as árvores.",
    description: "Escolha uma acomodação e prepare uma consulta.",
    label: "Acomodação",
    options: ["Chalé da mata", "Suíte do jardim"],
    action: "Consultar estadia",
    result: "Consulta de exemplo para",
    alt: "Chalé de madeira entre árvores",
    service: "site",
  },
  barbearia: {
    sector: "barbearia",
    brand: "Ofício Barbearia",
    title: "O corte no seu tempo.",
    description: "Escolha um horário para experimentar o agendamento.",
    label: "Horário simulado",
    options: ["10h30", "14h00", "16h30"],
    action: "Testar agendamento",
    result: "Agendamento simulado para",
    alt: "Barbeiro trabalhando em um corte",
    service: "landing",
  },
};
const demoButtons = document.querySelectorAll("[data-demo]");
let activeDemo = demos.forno;
function switchDemo(key) {
  activeDemo = demos[key];
  demoButtons.forEach((button) =>
    button.setAttribute("aria-pressed", String(button.dataset.demo === key)),
  );
  byId("demo-stage").dataset.theme = key;
  byId("demo-brand").textContent = activeDemo.brand;
  byId("demo-title").textContent = activeDemo.title;
  byId("demo-sub").textContent = activeDemo.description;
  byId("demo-label").textContent = activeDemo.label;
  byId("demo-choice").replaceChildren(
    ...activeDemo.options.map((value) => new Option(value, value)),
  );
  byId("demo-submit").textContent = activeDemo.action;
  byId("demo-photo").alt = activeDemo.alt;
  byId("demo-photo").src = "./media/" + key + ".webp";
  byId("demo-result").textContent = "";
  byId("demo-quote").firstChild.textContent =
    "Quero um projeto para " + activeDemo.sector + " ";
}
demoButtons.forEach((button) =>
  button.addEventListener("click", () => switchDemo(button.dataset.demo)),
);
byId("featured-demo").addEventListener("click", () => switchDemo("forno"));
byId("demo-form").addEventListener("submit", (event) => {
  event.preventDefault();
  byId("demo-result").textContent =
    activeDemo.result + " · " + byId("demo-choice").value + ".";
  countAction("demo");
});
byId("demo-quote").addEventListener("click", () => {
  selectService(activeDemo.service);
  byId("segment").value = activeDemo.sector;
});

const who = byId("who");
who.addEventListener("input", () => who.setCustomValidity(""));
byId("brief").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!who.value.trim()) {
    who.setCustomValidity("Informe seu primeiro nome.");
    who.reportValidity();
    return;
  }
  const segment = byId("segment").value.trim();
  const goal = byId("objective").value.trim();
  const lines = [
    "Olá, Manson! Sou " + who.value.trim() + ". Vim pelo site da Mansonware.",
    "Projeto: " + service.selectedOptions[0].textContent,
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
    !["visit", "demo", "direct", "brief"].includes(action)
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

document.querySelectorAll("[data-preview]").forEach((link) => {
  link.addEventListener("click", () => switchDemo(link.dataset.preview));
});
