// Free, isolated counter. Render stores periodic totals in its private application logs.
import { createServer } from "node:http";
const origin = new URL(process.env.SITE_URL).origin;
const actions = new Set(["/visit", "/demo", "/direct", "/brief"]);
const counts = new Map();
function flush() {
  if (!counts.size) return;
  console.log(
    JSON.stringify({
      metric: "mw_actions",
      periodEnd: new Date().toISOString(),
      counts: Object.fromEntries(counts),
    }),
  );
  counts.clear();
}
setInterval(flush, 60000).unref();
const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/")
    return res.writeHead(200).end("OK");
  if (
    req.method !== "POST" ||
    req.headers.origin !== origin ||
    !actions.has(req.url) ||
    req.headers["transfer-encoding"] ||
    Number(req.headers["content-length"] || 0) !== 0
  ) {
    return res.writeHead(404).end();
  }
  const key = req.url.slice(1);
  counts.set(key, (counts.get(key) || 0) + 1);
  res
    .writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Cache-Control": "no-store",
    })
    .end();
});
server.listen(Number(process.env.PORT || 4174), "0.0.0.0");
process.on("SIGTERM", () => {
  server.close(flush);
  flush();
});
