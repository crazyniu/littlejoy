// Deploys out/ to the `littlejoy-games` Cloudflare Worker with the Workers
// static assets Direct Upload API
// (https://developers.cloudflare.com/workers/static-assets/direct-upload/).
//
//   node scripts/cf-assets.mjs deploy            -> full deploy (CI); needs
//                                                  CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID
//   node scripts/cf-assets.mjs check             -> dry run: manifest size + worker modules (CI)
//   node scripts/cf-assets.mjs manifest          -> deploy/manifest.json + deploy/assets-config.json
//   node scripts/cf-assets.mjs upload SESSION    -> uploads the buckets the session asked for,
//                                                  prints the completion JWT
//
// `manifest` + `upload` are the manual path used with the Cloudflare MCP when no
// API token is available (see CLAUDE.md → "Deploying").
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, relative, sep } from "node:path";
import { languages } from "../lib/languages.js";
import { legacyRoutes, routes } from "../lib/routes.mjs";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "out");
const DEPLOY = join(ROOT, "deploy");
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const API = "https://api.cloudflare.com/client/v4";

// Production Worker settings. Keep in sync with the dashboard if changed there.
const SCRIPT = "littlejoy-games";
const MAIN_MODULE = "worker.mjs";
const COMPATIBILITY_DATE = "2026-11-18";

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
// _headers is not an asset: its rules travel in the assets config.
const skip = (path) => /(^|\/)(index\.txt|__next\.[^/]*\.txt)$/.test(path) || path === "/_headers";

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
  }
  return list;
}

const headersFile = join(OUT, "_headers");
const assetsConfig = async () => ({
  html_handling: "auto-trailing-slash",
  not_found_handling: "404-page",
  run_worker_first: runWorkerFirst(),
  ...(existsSync(headersFile) ? { _headers: await readFile(headersFile, "utf8") } : {}),
});

async function buildManifest() {
  const list = await files();
  const manifest = Object.fromEntries(list.map(({ path, hash, size }) => [path, { hash, size }]));
  const total = list.reduce((s, f) => s + f.size, 0);
  console.error(`${list.length} files, ${(total / 1048576).toFixed(1)} MiB`);
  return { list, manifest };
}

async function api(method, path, { body, jwt } = {}) {
  const headers = { Authorization: "Bearer " + (jwt || TOKEN) };
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res = await fetch(API + path, {
    method,
    headers,
    body: body instanceof FormData ? body : body && JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(`${method} ${path} → HTTP ${res.status} ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.result;
}

async function uploadBuckets(list, jwt, buckets) {
  if (!buckets?.length) {
    console.error("All assets already uploaded");
    return jwt;
  }
  const byHash = new Map(list.map((f) => [f.hash, f]));
  let completion = null;
  for (const [i, bucket] of buckets.entries()) {
    const form = new FormData();
    for (const hash of bucket) {
      const f = byHash.get(hash);
      if (!f) throw new Error("Unknown hash " + hash + " — rebuild the manifest");
      const b64 = (await readFile(f.file)).toString("base64");
      form.append(hash, new File([b64], hash, { type: f.type }));
    }
    const result = await api("POST", `/accounts/${ACCOUNT}/workers/assets/upload?base64=true`, {
      body: form,
      jwt,
    });
    if (result?.jwt) completion = result.jwt;
    console.error(`bucket ${i + 1}/${buckets.length}: ${bucket.length} files`);
  }
  if (!completion) throw new Error("Upload finished without a completion token");
  return completion;
}

// worker.mjs plus every module it imports through relative paths.
async function workerModules() {
  const modules = new Map();
  async function add(path) {
    if (modules.has(path)) return;
    const source = await readFile(join(ROOT, path), "utf8");
    modules.set(path, source);
    for (const [, spec] of source.matchAll(/\bfrom\s+["'](\.{1,2}\/[^"']+)["']/g)) {
      await add(normalize(join(dirname(path), spec)).split(sep).join("/"));
    }
  }
  await add(MAIN_MODULE);
  return modules;
}

async function deploy() {
  if (!TOKEN || !ACCOUNT) throw new Error("Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID");
  const { list, manifest } = await buildManifest();
  const session = await api(
    "POST",
    `/accounts/${ACCOUNT}/workers/scripts/${SCRIPT}/assets-upload-session`,
    { body: { manifest } },
  );
  const completion = await uploadBuckets(list, session.jwt, session.buckets);

  const form = new FormData();
  form.append(
    "metadata",
    new Blob(
      [
        JSON.stringify({
          main_module: MAIN_MODULE,
          compatibility_date: COMPATIBILITY_DATE,
          bindings: [{ type: "assets", name: "ASSETS" }],
          assets: { jwt: completion, config: await assetsConfig() },
        }),
      ],
      { type: "application/json" },
    ),
  );
  for (const [path, source] of await workerModules()) {
    form.append(path, new Blob([source], { type: "application/javascript+module" }), path);
  }
  const result = await api("PUT", `/accounts/${ACCOUNT}/workers/scripts/${SCRIPT}`, { body: form });
  console.log(`Deployed ${SCRIPT} (${result.etag?.slice(0, 12) ?? "ok"}) at ${result.modified_on}`);
}

async function manifestFiles() {
  await mkdir(DEPLOY, { recursive: true });
  const { manifest } = await buildManifest();
  await writeFile(join(DEPLOY, "manifest.json"), JSON.stringify(manifest));
  await writeFile(join(DEPLOY, "assets-config.json"), JSON.stringify(await assetsConfig(), null, 2));
  console.log("→ deploy/manifest.json, deploy/assets-config.json");
}

async function upload(sessionFile) {
  if (!ACCOUNT) throw new Error("Set CLOUDFLARE_ACCOUNT_ID");
  const session = JSON.parse(await readFile(sessionFile, "utf8"));
  const { jwt, buckets = [] } = session.result ?? session;
  console.log(await uploadBuckets(await files(), jwt, buckets));
}

async function check() {
  await buildManifest();
  const modules = [...(await workerModules()).keys()];
  console.log(`worker modules: ${modules.join(", ")}`);
  const config = await assetsConfig();
  console.log(`run_worker_first: ${config.run_worker_first.length} patterns`);
  console.log(`_headers: ${config._headers ? config._headers.split("\n").filter((l) => l.startsWith("/")).length + " rules" : "none"}`);
}

const [command, arg] = process.argv.slice(2);
if (command === "deploy") await deploy();
else if (command === "check") await check();
else if (command === "manifest") await manifestFiles();
else if (command === "upload") await upload(arg);
else console.log("usage: node scripts/cf-assets.mjs deploy | check | manifest | upload SESSION.json");
