import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const match = html.match(/<script>([\\s\\S]*?)<\\/script>/);

assert.ok(match, "Script inline do Local Studio não encontrado");
assert.doesNotThrow(
  () => new vm.Script(match[1], { filename: "index.html inline script" }),
  "O JavaScript do Local Studio precisa compilar antes de renderizar a prévia"
);
assert.match(html, /id="phone" value="" placeholder="DDD \\+ número do negócio"/);
assert.match(html, /id="rating" value="" placeholder="Ex\\.: 4,8"/);
assert.match(html, /id="reviews" value="" placeholder="Ex\\.: 25 avaliações"/);
assert.match(html, /whatsapp-pendente/);
assert.match(html, /Dados fornecidos pelo negócio/);
assert.doesNotMatch(html, /Atendimento cuidadoso, experiência simples/);
assert.doesNotMatch(html, /Tudo bem organizado e fácil de resolver/);
assert.doesNotMatch(html, /ph\\(s\\.phone\\)\\|\\|'5512999999999'/);

console.log("PASS Local Studio: sintaxe da prévia, WhatsApp configurável e avaliações sem prova fictícia");
