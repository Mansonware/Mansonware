// Run from a checkout with Playwright and axe-core installed for testing.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const url = "http://127.0.0.1:4173";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
});
const context = await browser.newContext({
  reducedMotion: "reduce",
  bypassCSP: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const metrics = [];
await context.route("https://metrics.test/**", async (route) => {
  const request = route.request();
  metrics.push(new URL(request.url()).pathname);
  assert.equal(request.postData(), null);
  assert.equal(request.headers().cookie, undefined);
  await route.fulfill({
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
});
await mkdir("test-results", { recursive: true });
async function audit(label) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const violations = await page.evaluate(async () => {
    const result = await axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    });
    return result.violations.map((item) => ({
      id: item.id,
      targets: item.nodes.map((node) => node.target),
    }));
  });
  assert.deepEqual(violations, [], label + ": " + JSON.stringify(violations));
}
const foodUrl = url + "/?para=lanchonete";
const offerPrice = "R$ 690 de implantação + R$ 99/mês";

async function readWhatsAppMessage() {
  await page.route(
    "https://wa.me/**",
    async (route) => {
      await route.abort();
    },
    { times: 1 },
  );
  const abortedNavigation = page.waitForEvent(
    "framenavigated",
    (frame) => frame === page.mainFrame(),
  );
  const request = page.waitForEvent("requestfailed", {
    predicate: (req) => req.url().startsWith("https://wa.me/"),
  });
  await page.locator("#brief button").click({ noWaitAfter: true });
  const [failedRequest] = await Promise.all([request, abortedNavigation]);
  const target = new URL(failedRequest.url());
  assert.equal(target.pathname, "/5512996335539");
  return target.searchParams.get("text");
}

async function checkPortfolio(foodMode) {
  const feature = page.locator(".work-feature");
  assert.equal(
    await feature.locator("p").first().innerText(),
    "O cliente monta o lanche no cardápio digital e envia o pedido pelo WhatsApp. Na mesma hora, a cozinha recebe o pedido impresso na impressora térmica.",
  );
  assert.deepEqual(await feature.locator("li").allInnerTexts(), [
    "Cardápio",
    "Carrinho",
    "WhatsApp e cozinha",
  ]);
  const extra = feature.locator("ol + p[data-lanche]");
  assert.equal(
    (await extra.textContent()).trim(),
    "Impressão na cozinha: recurso extra para novos clientes.",
  );
  assert.equal(await extra.isVisible(), foodMode);
  assert.equal(
    await page.locator(".work-card h3").first().innerText(),
    "Magali Lanches",
  );
  assert.deepEqual(
    await page.locator(".work-card header small").allInnerTexts(),
    [
      "Entregue",
      "Em desenvolvimento",
      "Em desenvolvimento",
      "Prova de conceito",
    ],
  );
}

async function checkMonthlyFAQ(foodMode) {
  const question = page.getByText("Preciso pagar mensalidade?", {
    exact: true,
  });
  const answer = question.locator("..").locator("p:visible");
  await question.click();
  assert.equal(
    await answer.innerText(),
    foodMode
      ? "Sim. O cardápio para lanchonetes tem implantação de R$ 690 e mensalidade de R$ 99, com mínimo de 3 meses. A mensalidade mantém o cardápio no ar, inclui alterações de produtos e preços quando você pedir e suporte pelo WhatsApp."
      : "A Mansonware não exige mensalidade para criar o site. Domínio, hospedagem, manutenção opcional e serviços de terceiros são discriminados na proposta quando se aplicam.",
  );
  await question.click();
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function checkFoodMode(width, height) {
  await page.goto(foodUrl);
  await page.evaluate(() => document.fonts.ready);
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.equal(
    await page
      .locator('script:not([type="application/ld+json"]):not([src])')
      .count(),
    0,
  );
  assert.equal(await page.inputValue("#service"), "cardapio");
  assert.equal(await page.locator('#service [value="catalogo"]').count(), 0);
  assert.equal(
    (await page.locator("#estimate").innerText()).replace(/\s+/g, " "),
    offerPrice,
  );
  assert.equal(await page.locator("#estimate-label").innerText(), "Valores");
  assert(await page.locator("#sob-medida").isHidden());
  assert.notEqual(
    await page.locator('.journey img[src="./media/forno.webp"]').getAttribute("loading"),
    "lazy",
  );
  assert(await page.locator("#objective").isVisible());
  assert(
    (await page.locator("#objective").getAttribute("placeholder")) ===
      "Ex.: os pedidos chegam bagunçados no WhatsApp",
  );
  assert(
    await page
      .locator(".launch [data-geral]")
      .evaluateAll((nodes) =>
        nodes.every((node) => getComputedStyle(node).display === "none"),
      ),
  );
  assert.doesNotMatch(await page.locator("body").innerText(), /R\$ (297|997)/);
  await checkPortfolio(true);
  assert.deepEqual(await page.locator(".food-offer h3 + p").allInnerTexts(), [
    "Cardápio no ar, alterações de produtos e preços quando você pedir e suporte pelo WhatsApp. Mínimo de 3 meses.",
    "Impressão automática do pedido na cozinha, sob consulta.",
  ]);
  await checkMonthlyFAQ(true);
  for (const href of await page
    .locator('a[href^="https://wa.me/"]')
    .evaluateAll((links) => links.map((link) => link.href))) {
    const target = new URL(href);
    assert.equal(target.pathname, "/5512996335539");
    assert(target.searchParams.get("text").includes(offerPrice));
  }
  await audit("lanchonete " + width);
  if (width === 390) {
    const [demoTop, offerTop, projectTop] = await Promise.all(
      ["#experimente", "#servicos", "#projetos"].map((selector) =>
        page
          .locator(selector)
          .evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY)),
      ),
    );
    // Order in this mode: playable menu, offer, then the delivered case right after the offer.
    assert(demoTop < offerTop && offerTop < projectTop);
    assert(projectTop - offerTop <= 800, "Oferta longe do portfólio");
    assert(projectTop <= 2500, "Portfólio começa em " + projectTop + " px");
    console.log("PASS início de Projetos a 390 px:", projectTop);
    for (const selector of [".launch-intro", ".launch .lead", ".hero-note"]) {
      const box = await page.locator(selector + "[data-lanche]").boundingBox();
      assert(
        box && box.y >= 0 && box.y + box.height <= height,
        selector + " fora da primeira tela",
      );
    }
    assert.match(
      await page.locator(".launch .lead:visible").innerText(),
      /monta o pedido no cardápio/,
    );
    assert.match(
      await page.locator(".hero-note:visible").innerText(),
      /R\$ 690.*R\$ 99\/mês/,
    );
    await page.screenshot({ path: "test-results/lanchonete-hero.png" });
    for (const [label, selector] of [
      ["oferta", ".food-offer"],
      ["magali", ".work-feature"],
      ["orcamento", "#brief"],
    ]) {
      await page
        .locator(selector)
        .screenshot({ path: "test-results/lanchonete-" + label + ".png" });
    }
  }
  if (width === 390 || width === 320) {
    const priceLines = await page
      .locator("#estimate > span")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const range = document.createRange();
          range.selectNodeContents(node);
          const rects = [...range.getClientRects()];
          return {
            text: node.textContent,
            lines: rects.length,
            top: rects[0].top,
            bottom: rects[0].bottom,
          };
        }),
      );
    assert.deepEqual(
      priceLines.map((line) => [line.text, line.lines]),
      [
        ["R$ 690 de implantação", 1],
        ["+ R$ 99/mês", 1],
      ],
    );
    assert(priceLines[1].top >= priceLines[0].bottom);
    await page.locator("#hero-quote").click();
    assert.equal(new URL(page.url()).search, "?para=lanchonete");
    assert.equal(new URL(page.url()).hash, "#orcamento");
    const quick = await readWhatsAppMessage();
    assert.equal(
      quick,
      [
        "Olá, Manson! Vim pelo link para lanchonetes.",
        "Projeto: Cardápio digital para lanchonete",
        "Valores: " + offerPrice,
        "Podemos conversar?",
      ].join("\n"),
    );
    await page.goto(foodUrl);
    const goal = "Cozinha & balcão\nOrganizar os pedidos.";
    await page.fill("#objective", goal);
    assert(
      (await readWhatsAppMessage()).includes("O que quero resolver: " + goal),
    );
    await page.goto(foodUrl);
    await page.selectOption("#service", "bot");
    assert.equal(
      await page.locator("#estimate-label").innerText(),
      "Estimativa inicial",
    );
    assert.equal(await page.inputValue("#service"), "bot");
    const other = await readWhatsAppMessage();
    assert.match(other, /Vim pelo link para lanchonetes/);
    assert.match(other, /Bots para WhatsApp/);
    assert.doesNotMatch(other, /R\$ 690|Quantidade/);
  }
  console.log(
    "PASS oferta, portfólio, WhatsApp, âncoras e axe no modo lanchonete:",
    width,
  );
}

async function tapDemo(selector) {
  await page.locator(selector).click();
}
async function checkDemos(width) {
  await page.goto(url);
  const tabs = page.locator("#experimente [role=tab]");
  assert.equal(await tabs.count(), 4);
  assert.equal(await page.locator("#experimente .demo-panel:visible").count(), 1);
  for (const note of await page.locator(".phone-note").allInnerTexts())
    assert.equal(note, "Demonstração · marcas e preços fictícios");

  // Cardápio: 2 margheritas + 1 refrigerante = R$ 122,00.
  assert(await page.locator("#cart-send").isDisabled());
  const add = (item) =>
    tapDemo('#demo-cardapio [data-item="' + item + '"] [data-step="1"]');
  await add("Pizza margherita");
  await add("Pizza margherita");
  await add("Refrigerante 2 L");
  assert.equal(
    (await page.locator("#cart-total").innerText()).replace(/\s/g, " "),
    "R$ 122,00",
  );
  await tapDemo("#cart-send");
  const order = (await page.locator("#cart-bubble").innerText()).replace(
    /\s+/g,
    " ",
  );
  assert.equal(
    order,
    "Olá! Quero pedir: 2 × Pizza margherita 1 × Refrigerante 2 L Total: R$ 122,00",
  );

  // Landing page.
  await tapDemo("#tab-landing");
  assert(await page.locator("#demo-landing").isVisible());
  await tapDemo("#landing-cta");
  assert.equal(
    await page.locator("#landing-bubble").innerText(),
    "Olá! Quero agendar corte + barba.",
  );

  // Bot: three scripted answers, then reset.
  await tapDemo("#tab-bot");
  for (const [reply, answer] of [
    ["horarios", "Atendemos de terça a sábado, das 9h às 19h."],
    ["precos", "Corte + barba: R$ 60"],
    ["pessoa", "Certo! Vou chamar a equipe."],
  ]) {
    await tapDemo('#demo-bot [data-reply="' + reply + '"]');
    assert.match(
      await page.locator("#chat-log .msg.bot").last().innerText(),
      new RegExp(answer.replace(/[.+$]/g, "\\$&")),
    );
  }
  await tapDemo("#chat-reset");
  assert.equal(await page.locator("#chat-log .msg").count(), 1);

  // Site institucional: inner pages and contact.
  await tapDemo("#tab-site");
  for (const pageName of ["local", "contato", "quartos"]) {
    await tapDemo('#demo-site [data-page="' + pageName + '"]');
    assert(
      await page
        .locator('[data-page-panel="' + pageName + '"]')
        .isVisible(),
    );
  }
  await tapDemo('#demo-site [data-page="contato"]');
  await tapDemo("#site-cta");
  assert.match(
    await page.locator("#site-bubble").innerText(),
    /consultar disponibilidade/,
  );
  assert(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  if (width === 390)
    for (const id of ["cardapio", "landing", "bot", "site"]) {
      await tapDemo("#tab-" + id);
      await page
        .locator("#demo-" + id + " .phone")
        .screenshot({ path: "test-results/demo-" + id + "-390.png" });
    }

  // Each CTA selects its service and names the demo in the WhatsApp message.
  for (const [id, demo, project, value] of [
    ["cardapio", "Cardápio", "Catálogo digital", "A partir de R$ 997"],
    ["landing", "Landing page", "Landing page", "A partir de R$ 297"],
    ["bot", "Bot de WhatsApp", "Bots para WhatsApp", "Sob consulta"],
    ["site", "Site institucional", "Site institucional", "A partir de R$ 797"],
  ]) {
    await page.goto(url);
    await tapDemo("#tab-" + id);
    await tapDemo("#demo-" + id + " a[data-demo]");
    const text = (await readWhatsAppMessage()).replace(/\u00a0/g, " ");
    assert.equal(
      text,
      [
        "Olá, Manson! Vim pelo site da Mansonware.",
        "Testei a demonstração: " + demo + ".",
        "Projeto: " + project,
        "Estimativa inicial: " + value,
        "Podemos conversar sobre o escopo e o valor final?",
      ].join("\n"),
    );
  }

  // Lanchonete mode: only the menu demo, priced with the food offer.
  await page.goto(foodUrl);
  assert(await page.locator(".demo-tabs").isHidden());
  assert(await page.locator("#demo-cardapio").isVisible());
  await add("Pizza calabresa");
  await tapDemo("#demo-cardapio a[data-demo]");
  assert.equal(await page.inputValue("#service"), "cardapio");
  assert.equal(
    await readWhatsAppMessage(),
    [
      "Olá, Manson! Vim pelo link para lanchonetes.",
      "Testei a demonstração: Cardápio.",
      "Projeto: Cardápio digital para lanchonete",
      "Valores: " + offerPrice,
      "Podemos conversar?",
    ].join("\n"),
  );
  console.log("PASS demos interativas e mensagens do WhatsApp:", width);
}

async function checkDemoKeyboard() {
  await page.goto(url);
  await page.locator("#tab-cardapio").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement.id), "tab-landing");
  assert(await page.locator("#demo-landing").isVisible());
  await page.keyboard.press("End");
  assert.equal(await page.evaluate(() => document.activeElement.id), "tab-site");
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.evaluate(() => document.activeElement.id), "tab-cardapio");
  // Tab from the tab list reaches the menu buttons in visual order.
  for (let step = 0; step < 4; step++) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() =>
      document.activeElement.getAttribute("aria-label"),
    );
    if (label === "Adicionar pizza margherita") break;
  }
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#demo-cardapio output").first().innerText(), "1");
  for (const id of ["landing", "bot", "site"]) {
    await page.locator("#tab-" + id).click();
    await audit("demo " + id);
  }
  console.log("PASS teclado e axe nas abas das demos");
}

try {
  for (const [width, height] of [
    [320, 650],
    [360, 740],
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Overflow at " + width,
    );
    assert(
      await page
        .locator('a[href^="#"]')
        .evaluateAll((links) =>
          links.every((link) => document.getElementById(link.hash.slice(1))),
        ),
    );
    await checkPortfolio(false);
    await checkMonthlyFAQ(false);
    assert(await page.locator("#sob-medida").isVisible());
    assert.match(
      await page.locator(".hero-note:visible").innerText(),
      /R\$ 297/,
    );
    assert.match(await page.locator(".rate-list").innerText(), /R\$ 997/);
    assert.doesNotMatch(await page.locator("body").innerText(), /R\$ 690/);
    await audit(String(width));
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: "test-results/" + width + ".png",
        fullPage: true,
      });
    await checkFoodMode(width, height);
    if (width === 320 || width === 390) await checkDemos(width);
    console.log("PASS viewport, anchors, axe:", width, height);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await checkDemoKeyboard();
  await page.goto(url + "/?para=xyz");
  assert.equal(await page.inputValue("#service"), "landing");
  assert.doesNotMatch(await page.locator("body").innerText(), /R\$ 690/);
  const single = await readWhatsAppMessage();
  assert.match(single, /Projeto: Landing page/);
  assert.doesNotMatch(single, /Quantidade/);
  await page.goto(url);
  await page.keyboard.press("Tab");
  assert.equal(
    await page.locator(":focus").innerText(),
    "Pular para o conteúdo",
  );
  await page.keyboard.press("Enter");
  for (const name of ["Serviços", "Projetos", "Dúvidas"]) {
    await page
      .getByRole("navigation")
      .getByRole("link", { name, exact: true })
      .click();
  }
  assert.doesNotMatch(
    await page.locator("body").innerText(),
    /estúdio|\bstudio\b/i,
  );
  assert.equal(await page.locator("#demos").count(), 0);
  assert.equal(await page.locator(".solution").count(), 4);
  assert.equal(await page.locator(".work-card").count(), 4);
  for (const card of await page.locator(".work-card").all()) {
    assert(await card.locator("p").first().isVisible());
    assert.equal(await card.locator(".work-flow li").count(), 3);
  }
  for (const selector of [".brief-details", ".faq details"]) {
    const details = page.locator(selector).first();
    await details.locator("summary").focus();
    await page.keyboard.press("Enter");
    assert(await details.evaluate((el) => el.open));
  }
  console.log("PASS keyboard, cards, FAQ and optional fields");

  for (const [key, base] of Object.entries({
    landing: 297,
    premium: 497,
    site: 797,
    catalogo: 997,
    loja: 0,
    bot: 0,
    ia: 0,
    saas: 0,
  })) {
    await page.click('#servicos [data-service="' + key + '"]');
    assert.equal(await page.inputValue("#service"), key);
    if (base) {
      await page.selectOption("#quantity", "2");
      assert.equal(
        (await page.textContent("#estimate")).replace(/\D/g, ""),
        String(2 * base),
      );
    } else {
      assert.equal(await page.textContent("#estimate"), "Sob consulta");
      assert(await page.locator("#qty-field").isHidden());
    }
  }
  await context.route("https://wa.me/**", (route) =>
    route.fulfill({ status: 200, body: "WhatsApp test destination" }),
  );
  await page.goto(url);
  await page.click('#sob-medida [data-service="bot"]');
  assert.equal(
    await page.locator(".brief-details").evaluate((el) => el.open),
    false,
  );
  await page.click("#brief button");
  await page.waitForURL("https://wa.me/**");
  const quick = new URL(page.url());
  assert.equal(quick.pathname, "/5512996335539");
  assert.match(quick.searchParams.get("text"), /Bots para WhatsApp/);
  assert.match(quick.searchParams.get("text"), /Sob consulta/);
  await page.goto(url);
  await page.click(".brief-details summary");
  await page.selectOption("#service", "premium");
  await page.selectOption("#quantity", "2");
  await page.fill("#who", "João & Cia");
  await page.fill("#segment", "Padaria");
  await page.fill("#objective", "Café & pão? #2");
  await page.click("#brief button");
  await page.waitForURL("https://wa.me/**");
  const target = new URL(page.url());
  assert.equal(target.pathname, "/5512996335539");
  const message = target.searchParams.get("text");
  for (const part of [
    "João & Cia",
    "Padaria",
    "Café & pão? #2",
    "994",
    "premium",
    "Quantidade: 2",
  ])
    assert(message.includes(part));
  assert.deepEqual(metrics, []);
  console.log(
    "PASS eight offers, estimates, optional details, quick request, WhatsApp destination and encoded briefing",
  );

  await page.goto(url);
  await page.click(".privacy summary");
  await page.check("#consent");
  await page.click("[data-direct]");
  await page.waitForURL("https://wa.me/**");
  assert.deepEqual(metrics, ["/visit", "/direct"]);
  await page.goto(url);

  await page.click("#brief button");
  await page.waitForURL("https://wa.me/**");
  assert.deepEqual(metrics.slice(-2), ["/visit", "/brief"]);
  await page.goto(url);
  await page.click(".privacy summary");
  await page.uncheck("#consent");
  const count = metrics.length;
  await page.reload();
  assert(!(await page.isChecked("#consent")));
  assert.equal(count, metrics.length);
  await context.addInitScript(() =>
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true }),
  );
  await page.reload();
  assert(await page.locator("#consent").isDisabled());
  console.log("PASS opt-in, three anonymous events, revocation and GPC");

  const plain = await browser.newContext({ javaScriptEnabled: false });
  const plainPage = await plain.newPage();
  await plainPage.goto(foodUrl);
  assert(await plainPage.locator(".hero-note[data-geral]").isVisible());
  assert(await plainPage.locator(".food-offer").isHidden());
  assert(
    (
      await plainPage.locator("[data-direct]").first().getAttribute("href")
    ).startsWith("https://wa.me/5512996335539"),
  );
  assert(await plainPage.locator("#brief").isHidden());

  const normal = await browser.newContext();
  const protectedPage = await normal.newPage();
  protectedPage.on("pageerror", (e) => errors.push(e.message));
  protectedPage.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await protectedPage.goto(foodUrl);
  assert.equal(await protectedPage.inputValue("#service"), "cardapio");
  await protectedPage.click("#play-journey");
  assert(
    await protectedPage
      .locator(".order-bubble")
      .evaluate((el) => el.getAnimations().length > 0),
  );
  await protectedPage.emulateMedia({ reducedMotion: "reduce" });
  await protectedPage.locator("#play-journey").waitFor({ state: "hidden" });
  assert.equal(
    await protectedPage
      .locator(".journey")
      .evaluate((el) => el.getAnimations({ subtree: true }).length),
    0,
  );
  assert.equal(
    await protectedPage
      .locator(".order-bubble")
      .evaluate((el) => getComputedStyle(el).opacity),
    "1",
  );
  console.log("PASS motion replay and static order with reduced motion");
  await protectedPage.goto(url); // All service cards are displayed on the general page.
  for (const selector of [".solution", ".work-card", ".brief"]) {
    const element = protectedPage.locator(selector).last();
    await element.scrollIntoViewIfNeeded();
    assert.equal(
      await element.evaluate(
        (el) => el.getAnimations({ subtree: true }).length,
      ),
      0,
    );
  }
  await protectedPage.emulateMedia({ reducedMotion: "no-preference" });
  for (const selector of [".solution", ".work-card", ".brief"]) {
    const element = protectedPage.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    await element.evaluate(
      (el) =>
        new Promise((resolve, reject) => {
          if (el.classList.contains("entered")) return resolve();
          const observer = new MutationObserver(() => {
            if (el.classList.contains("entered")) {
              observer.disconnect();
              clearTimeout(timeout);
              resolve();
            }
          });
          const timeout = setTimeout(() => {
            observer.disconnect();
            reject(new Error("Missing viewport animation"));
          }, 3500);
          observer.observe(el, {
            attributes: true,
            attributeFilter: ["class"],
          });
        }),
    );
  }
  for (const path of ["robots.txt", "sitemap.xml", "media/social.jpg"])
    assert((await normal.request.get(url + "/" + path)).ok());
  assert.deepEqual(errors, []);
  console.log(
    "PASS JavaScript fallback, CSP, SEO and social assets; Chromium",
    browser.version(),
  );
} finally {
  await browser.close();
}
