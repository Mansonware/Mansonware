import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile("comercial/demo-landing.html", "utf8");
const script = await readFile("comercial/demo-landing.js", "utf8");
const segments = ["estetica", "solar", "oficina", "imobiliaria", "arquitetura", "odontologia", "servicos"];

for (const segment of segments) {
  const start = script.indexOf("  " + segment + ": {");
  assert.notEqual(start, -1, "Segmento ausente: " + segment);
  const next = script.indexOf("\n  },", start);
  const block = script.slice(start, next === -1 ? script.length : next);
  assert(block.includes("image: \"https://images.unsplash.com/photo-"), "Imagem específica ausente: " + segment);
  assert(block.includes("imageAlt: \""), "Texto alternativo ausente: " + segment);
}

assert(html.includes('id="segment-image"'));
assert(html.includes("img-src 'self' https://images.unsplash.com"));
assert(html.includes('name="robots" content="noindex,nofollow"'));
assert(html.includes("R$ 297"));
assert(script.includes("https://wa.me/5512996335539"));
assert(script.includes("R$ 297"));

console.log("PASS V2 premium: 7 imagens segmentadas, textos alternativos, CSP, noindex, preço e WhatsApp");
