// Runs after `next build` (npm "postbuild"). The site renders entirely on the
// server and its behaviour lives in public/site.js, so the Next.js client
// runtime and RSC payloads are dead weight in out/. This script:
//   1. strips Next's <script> tags, script preloads and self.__next_f payloads
//      from every HTML page (≈60 % of each page's bytes),
//   2. removes the client chunks and RSC .txt files they referenced,
//   3. turns the "lost" route into /404.html,
//   4. writes sitemap.xml (with hreflang alternates), robots.txt and _headers.
import { readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { address, languages } from "../lib/languages.js";
import { routes } from "../lib/routes.mjs";

const SITE = "https://shopkivoo.com";
const OUT = join(import.meta.dirname, "..", "out");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
  );
  return nested.flat();
}

const rel = (file) => "/" + relative(OUT, file).split(sep).join("/");

// 1. Strip the client runtime from HTML.
let before = 0;
let after = 0;
const pages = (await walk(OUT)).filter((f) => f.endsWith(".html"));
for (const file of pages) {
  const html = await readFile(file, "utf8");
  const stripped = html
    .replace(/<script[^>]*\ssrc="\/_next\/[^"]*"[^>]*><\/script>/g, "")
    .replace(/<link[^>]*\sas="script"[^>]*\/?>/g, "")
    .replace(/<script>(?:\(self\.__next_f|self\.__next_f)[\s\S]*?<\/script>/g, "")
    .replace(/<script>\$R[CX][\s\S]*?<\/script>/g, "");
  if (/_next\/static\/chunks\/[^"]*\.js|__next_f/.test(stripped)) {
    throw new Error(`Next runtime still referenced in ${rel(file)}`);
  }
  before += html.length;
  after += stripped.length;
  await writeFile(file, stripped);
}

// 2. Remove what nothing references any more.
for (const file of await walk(OUT)) {
  const path = rel(file);
  if (/(^|\/)(index\.txt|__next\.[^/]*\.txt)$/.test(path) || /^\/_next\/static\/chunks\/.*\.js$/.test(path)) {
    await rm(file);
  }
}
for (const dir of await readdir(join(OUT, "_next", "static"))) {
  if (!["css", "media"].includes(dir)) await rm(join(OUT, "_next", "static", dir), { recursive: true, force: true });
}

// 3. 404 page.
await rename(join(OUT, "lost", "index.html"), join(OUT, "404.html"));
for (const dir of ["lost", "404", "_not-found"]) {
  await rm(join(OUT, dir), { recursive: true, force: true });
}

// 4. sitemap.xml, robots.txt, _headers.
const today = new Date().toISOString().slice(0, 10);
const urls = Object.keys(languages).flatMap((lang) =>
  routes.map((section) => {
    const links = Object.entries(languages)
      .map(
        ([code, { tag }]) =>
          `    <xhtml:link rel="alternate" hreflang="${tag}" href="${SITE}${address(code, section)}"/>`,
      )
      .concat(
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/${section ? section + "/" : ""}"/>`,
      )
      .join("\n");
    return `  <url>\n    <loc>${SITE}${address(lang, section)}</loc>\n    <lastmod>${today}</lastmod>\n${links}\n  </url>`;
  }),
);
await writeFile(
  join(OUT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`,
);
await writeFile(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

// Cache policy for static assets (Workers static assets read _headers;
// scripts/cf-assets.mjs passes it in the upload config). HTML keeps the
// default revalidate-every-time policy so deploys show up immediately.
await writeFile(
  join(OUT, "_headers"),
  [
    "/_next/static/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/fonts/*",
    "  Cache-Control: public, max-age=604800, stale-while-revalidate=86400",
    "/art/*",
    "  Cache-Control: public, max-age=604800, stale-while-revalidate=86400",
    "/site.js",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/play.js",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/*",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()",
    "",
  ].join("\n"),
);

const kb = (n) => (n / 1024).toFixed(0) + " KiB";
const size = (await stat(join(OUT, "404.html"))).size;
console.log(
  `postbuild: ${pages.length} pages, HTML ${kb(before)} → ${kb(after)}; 404.html ${kb(size)}; sitemap ${urls.length} URLs`,
);
