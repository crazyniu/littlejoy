// Routing smoke test against a running site (local preview or production).
//   node scripts/smoke.mjs http://localhost:4173
//   node scripts/smoke.mjs https://shopkivoo.com
import { languages } from "../lib/languages.js";
import { routes } from "../lib/routes.mjs";

const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const failures = [];
let count = 0;

async function expect(path, status, { lang = "en", location, contains } = {}) {
  count++;
  let res;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(base + path, {
        redirect: "manual",
        headers: { "Accept-Language": lang, "User-Agent": "littlejoy-smoke-test" },
      });
      break;
    } catch (error) {
      if (attempt === 3) {
        failures.push(`${path}: ${error.message}`);
        return;
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  const got = res.headers.get("location") || "";
  if (res.status !== status) failures.push(`${path} [${lang}]: expected ${status}, got ${res.status}`);
  else if (location && !got.endsWith(location))
    failures.push(`${path} [${lang}]: expected Location …${location}, got ${got}`);
  else if (contains && !(await res.text()).includes(contains))
    failures.push(`${path}: body does not contain ${JSON.stringify(contains)}`);
}

const jobs = [
  // Language negotiation on bare URLs.
  expect("/", 200, { lang: "en-US" }),
  expect("/", 302, { lang: "zh-CN", location: "/zh/" }),
  expect("/", 302, { lang: "zh-TW", location: "/zh-hant/" }),
  expect("/privacy/", 302, { lang: "de", location: "/de/privacy/" }),
  expect("/games/fly-home/", 302, { lang: "ko", location: "/ko/games/fly-home/" }),
  expect("/play/", 200, { lang: "en-GB", contains: "data-flock" }),
  // Legacy URLs.
  expect("/studio", 302, { lang: "en", location: "/en/about/" }),
  expect("/ja/guide/", 308, { location: "/ja/games/" }),
  // Pages ship without the Next.js client runtime.
  expect("/en/", 200, { contains: "/site.js?v=" }),
  // Static files and 404.
  expect("/site.js", 200),
  expect("/fonts/silkscreen.woff2", 200),
  expect("/sitemap.xml", 200, { contains: "hreflang" }),
  expect("/robots.txt", 200),
  // Finished art slots render the artwork, not the drawn fallback.
  expect("/en/games/fly-home/", 200, { contains: "/art/slots/fly-home-keyart.webp" }),
  expect("/en/about/", 200, { contains: "/art/slots/los-angeles-skyline.webp" }),
  expect("/art/r/slots/team-portrait-640.webp", 200),
  expect("/app-ads.txt", 200),
  expect("/this-page-does-not-exist/", 404, { contains: "CONTINUE?" }),
];
for (const lang of Object.keys(languages)) {
  for (const route of routes) jobs.push(expect(`/${lang}/${route ? route + "/" : ""}`, 200));
}
await Promise.all(jobs);

if (failures.length) {
  console.error(`✗ ${failures.length}/${count} checks failed on ${base}`);
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log(`✓ ${count} routing checks passed on ${base}`);
