// Render supplies RENDER_EXTERNAL_URL. SITE_URL can override it for a custom domain.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
const origin = new URL(
  process.env.SITE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    "http://localhost:4173",
);
const metrics = process.env.METRICS_URL
  ? new URL(process.env.METRICS_URL).origin
  : "";
if (metrics && !metrics.startsWith("https://"))
  throw new Error("METRICS_URL requer HTTPS.");
const output = "dist-comercial";
const url = origin.origin + "/";
const metadata = [
  '<link rel="canonical" href="' + url + '">',
  '<meta property="og:url" content="' + url + '">',
  metrics && '<meta name="metrics-endpoint" content="' + metrics + '">',
  '<meta http-equiv="Content-Security-Policy" content="default-src ' +
    "'self'; base-uri 'none'; object-src 'none'; form-action 'none'; connect-src 'self' " +
    metrics +
    "; style-src " +
    "'self' 'unsafe-inline'" +
    '">',
]
  .filter(Boolean)
  .join("\n");
const file = output + "/index.html";
const html = (await readFile("comercial/index.html", "utf8"))
  .replace("<title>", metadata + "\n<title>")
  .replace(
    'content="./media/social.jpg"',
    'content="' + url + 'media/social.jpg"',
  );
const pending = [...html.matchAll(/CONFIRMAR:[^<]*/g)].map(([note]) =>
  note.trim(),
);
if (pending.length) {
  const message =
    "Pendências comerciais antes da publicação:\n" + pending.join("\n");
  if (process.env.RENDER !== undefined) throw new Error(message);
  console.warn(message);
}
await mkdir(output, { recursive: true });
await cp("comercial", output, { recursive: true });
await writeFile(file, html);
await writeFile(
  output + "/robots.txt",
  "User-agent: *\nAllow: /\nSitemap: " + url + "sitemap.xml\n",
);
await writeFile(
  output + "/sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>' +
    url +
    "</loc></url></urlset>\n",
);
