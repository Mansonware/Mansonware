import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const start = html.indexOf("<script>");
const end = html.indexOf("</script>", start);

assert.ok(start >= 0 && end > start, "Script inline do Local Studio não encontrado");
const script = html.slice(start + "<script>".length, end);
assert.doesNotThrow(
  () => new vm.Script(script, { filename: "index.html inline script" }),
  "O JavaScript do Local Studio precisa compilar antes de renderizar a prévia"
);
assert.ok(html.includes('id="phone" value="" placeholder="DDD + número do negócio"'));
assert.ok(html.includes('id="rating" value="" placeholder="Ex.: 4,8"'));
assert.ok(html.includes('id="reviews" value="" placeholder="Ex.: 25 avaliações"'));
assert.ok(html.includes("whatsapp-pendente"));
assert.ok(html.includes("Dados fornecidos pelo negócio"));
assert.ok(!html.includes("Atendimento cuidadoso, experiência simples"));
assert.ok(!html.includes("Tudo bem organizado e fácil de resolver"));
assert.ok(!html.includes("ph(s.phone)||'5512999999999'"));

console.log("PASS Local Studio: sintaxe da prévia, WhatsApp configurável e avaliações sem prova fictícia");
