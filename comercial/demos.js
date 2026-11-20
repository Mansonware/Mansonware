"use strict";

// Interactive demos in #experimente. Everything stays inside the phone frame:
// no demo opens WhatsApp. Each first interaction reports which demo was tried,
// so the quote message can mention it.
(() => {
  const root = document.getElementById("experimente");
  if (!root) return;
  const brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const tested = (panel) =>
    document.dispatchEvent(
      new CustomEvent("demo:tested", { detail: panel.dataset.demoName }),
    );
  const show = (bubble, text) => {
    bubble.textContent = text;
    bubble.hidden = false;
  };

  // Tabs (WAI-ARIA tabs pattern, automatic activation).
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const visibleTabs = () => tabs.filter((tab) => tab.offsetParent !== null);
  function select(tab, focus) {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute("aria-controls")).hidden =
        !active;
    }
    if (focus) tab.focus();
  }
  for (const tab of tabs) {
    tab.addEventListener("click", () => select(tab, false));
    tab.addEventListener("keydown", (event) => {
      const list = visibleTabs();
      const index = list.indexOf(tab);
      const next = {
        ArrowRight: list[(index + 1) % list.length],
        ArrowLeft: list[(index - 1 + list.length) % list.length],
        Home: list[0],
        End: list[list.length - 1],
      }[event.key];
      if (!next) return;
      event.preventDefault();
      select(next, true);
    });
  }

  // Cardápio: steppers, cart total and the order the restaurant would receive.
  const menu = document.getElementById("demo-cardapio");
  const items = [...menu.querySelectorAll("[data-item]")];
  const send = document.getElementById("cart-send");
  const cartBubble = document.getElementById("cart-bubble");
  const cart = new Map(items.map((item) => [item, 0]));
  function renderCart() {
    let count = 0;
    let total = 0;
    for (const [item, qty] of cart) {
      item.querySelector("output").textContent = qty;
      count += qty;
      total += qty * Number(item.dataset.price);
    }
    document.getElementById("cart-count").textContent =
      count + (count === 1 ? " item" : " itens");
    document.getElementById("cart-total").textContent = brl.format(total);
    send.disabled = count === 0;
    cartBubble.hidden = true;
    return total;
  }
  for (const item of items) {
    item.addEventListener("click", (event) => {
      const step = Number(event.target.closest("[data-step]")?.dataset.step);
      if (!step) return;
      cart.set(item, Math.max(0, Math.min(9, cart.get(item) + step)));
      renderCart();
      tested(menu);
    });
  }
  send.addEventListener("click", () => {
    const total = renderCart();
    const lines = [...cart]
      .filter(([, qty]) => qty)
      .map(([item, qty]) => qty + " × " + item.dataset.item);
    show(
      cartBubble,
      ["Olá! Quero pedir:", ...lines, "Total: " + brl.format(total)].join(
        "\n",
      ),
    );
  });

  // Landing page.
  const landing = document.getElementById("demo-landing");
  document.getElementById("landing-cta").addEventListener("click", () => {
    show(
      document.getElementById("landing-bubble"),
      "Olá! Quero agendar corte + barba.",
    );
    tested(landing);
  });

  // Bot: scripted replies, no AI.
  const bot = document.getElementById("demo-bot");
  const log = document.getElementById("chat-log");
  const replies = {
    horarios: "Atendemos de terça a sábado, das 9h às 19h.",
    precos: "Corte: R$ 40\nBarba: R$ 30\nCorte + barba: R$ 60",
    pessoa: "Certo! Vou chamar a equipe. ✓",
  };
  const greeting = [...log.children].map((node) => node.cloneNode(true));
  function say(text, from) {
    const message = document.createElement("p");
    message.className = "msg " + from;
    message.textContent = text;
    log.append(message);
    log.scrollTop = log.scrollHeight;
  }
  for (const button of bot.querySelectorAll("[data-reply]")) {
    button.addEventListener("click", () => {
      say(button.textContent, "user");
      say(replies[button.dataset.reply], "bot");
      tested(bot);
    });
  }
  document.getElementById("chat-reset").addEventListener("click", () => {
    log.replaceChildren(...greeting.map((node) => node.cloneNode(true)));
  });

  // Site institucional: inner pages.
  const site = document.getElementById("demo-site");
  const pages = [...site.querySelectorAll("[data-page]")];
  for (const button of pages) {
    button.addEventListener("click", () => {
      for (const other of pages)
        other.setAttribute("aria-pressed", String(other === button));
      for (const panel of site.querySelectorAll("[data-page-panel]"))
        panel.hidden = panel.dataset.pagePanel !== button.dataset.page;
      document.getElementById("site-bubble").hidden = true;
      tested(site);
    });
  }
  document.getElementById("site-cta").addEventListener("click", () => {
    show(
      document.getElementById("site-bubble"),
      "Olá! Quero consultar disponibilidade para o fim de semana.",
    );
    tested(site);
  });
})();
