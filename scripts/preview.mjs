// Local/LAN preview of the production build: serves out/ through worker.mjs,
// the same routing Cloudflare runs (language redirects, legacy paths).
//   npm run build && npm run preview          -> http://0.0.0.0:4173
//   PORT=8080 npm run preview
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { networkInterfaces } from "node:os";
import worker from "../worker.mjs";

const ROOT = join(import.meta.dirname, "..", "out");
const PORT = Number(process.env.PORT || 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

// Minimal stand-in for Cloudflare's static assets binding.
const ASSETS = {
  async fetch(request) {
    const url = new URL(request.url);
    const clean = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    let file = join(ROOT, clean);
    if (clean.endsWith("/")) file = join(file, "index.html");
    else if (!(await isFile(file)) && (await isFile(join(file, "index.html")))) {
      return new Response(null, { status: 308, headers: { Location: url.pathname + "/" } });
    }
    if (!(await isFile(file))) {
      const body = await readFile(join(ROOT, "404.html"));
      return new Response(body, { status: 404, headers: { "Content-Type": TYPES[".html"] } });
    }
    const body = await readFile(file);
    return new Response(body, {
      headers: { "Content-Type": TYPES[extname(file)] || "application/octet-stream" },
    });
  },
};

createServer(async (req, res) => {
  try {
    const url = "http://" + (req.headers.host || "localhost") + req.url;
    const response = await worker.fetch(
      new Request(url, { method: req.method, headers: req.headers }),
      { ASSETS },
    );
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(req.method === "HEAD" ? undefined : Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.writeHead(500).end(String(error));
  }
}).listen(PORT, "0.0.0.0", () => {
  const lan = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => `http://${i.address}:${PORT}/`);
  console.log(["Preview:", `http://localhost:${PORT}/`, ...lan].join("\n  "));
});
