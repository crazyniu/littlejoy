// Helpers for deploying out/ to the `littlejoy-games` Cloudflare Worker with
// the Direct Upload API (https://developers.cloudflare.com/workers/static-assets/direct-upload/).
//
//   node scripts/cf-assets.mjs manifest          -> deploy/manifest.json + deploy/assets-config.json
//   node scripts/cf-assets.mjs upload SESSION    -> uploads the buckets the session asked for,
//                                                  prints the completion JWT
//
// SESSION is the JSON result of
//   POST /accounts/{account}/workers/scripts/littlejoy-games/assets-upload-session
// (saved to a file). See CLAUDE.md → "Deploying" for the full sequence.
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";
import { languages } from "../lib/languages.js";
import { legacyRoutes, routes } from "../lib/routes.mjs";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "out");
const DEPLOY = join(ROOT, "deploy");
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

// Next.js writes RSC payloads (index.txt, __next.*.txt) for client-side
// navigation. The site uses plain links, so they are not deployed.
const skip = (path) => /(^|\/)(index\.txt|__next\.[^/]*\.txt)$/.test(path);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return files.flat();
}

async function files() {
  const list = [];
  for (const file of await walk(OUT)) {
    const path = "/" + relative(OUT, file).split(sep).join("/");
    if (skip(path)) continue;
    const bytes = await readFile(file);
    const ext = extname(file);
    const hash = createHash("sha256")
      .update(bytes.toString("base64") + ext.slice(1))
      .digest("hex")
      .slice(0, 32);
    list.push({ path, file, hash, size: bytes.length, type: TYPES[ext] || "application/octet-stream" });
  }
  return list;
}

// Paths the worker must see before static files: bare section URLs (language
// negotiation) and legacy URLs (redirects). Everything else is served directly.
function runWorkerFirst() {
  const list = ["/"];
  for (const route of [...routes.filter(Boolean), ...Object.keys(legacyRoutes)]) {
    list.push("/" + route, "/" + route + "/");
  }
  const legacyTop = Object.keys(legacyRoutes).filter((r) => !r.includes("/"));
  for (const lang of Object.keys(languages)) {
    for (const r of legacyTop) list.push(`/${lang}/${r}*`);
    list.push(`/${lang}/games/*`);
  }
  return list;
}

async function manifest() {
  await mkdir(DEPLOY, { recursive: true });
  const list = await files();
  const manifest = Object.fromEntries(list.map(({ path, hash, size }) => [path, { hash, size }]));
  const config = {
    html_handling: "auto-trailing-slash",
    not_found_handling: "404-page",
    run_worker_first: runWorkerFirst(),
  };
  await writeFile(join(DEPLOY, "manifest.json"), JSON.stringify(manifest));
  await writeFile(join(DEPLOY, "assets-config.json"), JSON.stringify(config, null, 2));
  const total = list.reduce((s, f) => s + f.size, 0);
  console.log(`${list.length} files, ${(total / 1048576).toFixed(1)} MiB → deploy/manifest.json`);
}

async function upload(sessionFile) {
  if (!ACCOUNT) throw new Error("Set CLOUDFLARE_ACCOUNT_ID");
  const session = JSON.parse(await readFile(sessionFile, "utf8"));
  const { jwt, buckets = [] } = session.result ?? session;
  if (!buckets.length) {
    console.log("Nothing to upload; completion JWT:\n" + jwt);
    return;
  }
  const byHash = new Map((await files()).map((f) => [f.hash, f]));
  let completion = null;
  for (const [i, bucket] of buckets.entries()) {
    const form = new FormData();
    for (const hash of bucket) {
      const f = byHash.get(hash);
      if (!f) throw new Error("Unknown hash " + hash + " — rebuild the manifest");
      const b64 = (await readFile(f.file)).toString("base64");
      form.append(hash, new File([b64], hash, { type: f.type }));
    }
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/workers/assets/upload?base64=true`,
      { method: "POST", headers: { Authorization: "Bearer " + jwt }, body: form },
    );
    const body = await res.json();
    if (!res.ok || !body.success) throw new Error(JSON.stringify(body.errors ?? body));
    if (body.result?.jwt) completion = body.result.jwt;
    console.error(`bucket ${i + 1}/${buckets.length}: ${bucket.length} files`);
  }
  console.log(completion);
}

const [command, arg] = process.argv.slice(2);
if (command === "manifest") await manifest();
else if (command === "upload") await upload(arg);
else console.log("usage: node scripts/cf-assets.mjs manifest | upload SESSION.json");
