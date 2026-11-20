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
    await audit(String(width));
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: "test-results/" + width + ".png",
        fullPage: true,
      });
    console.log("PASS viewport, anchors, axe:", width, height);
  }

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
    assert(await card.locator("p").isVisible());
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
    await page.click('[data-service="' + key + '"]');
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
  await page.click('[data-service="bot"]');
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
  await plainPage.goto(url);
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
  await protectedPage.goto(url);
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
