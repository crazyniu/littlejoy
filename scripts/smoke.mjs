// Routing smoke test against a running site (local preview or production).
//   node scripts/smoke.mjs http://localhost:4173
//   node scripts/smoke.mjs https://shopkivoo.com
import { languages } from "../lib/languages.js";
import { routes } from "../lib/routes.mjs";

const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const failures = [];
let count = 0;

async function expect(path, status, { lang = "en", location } = {}) {
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
}

const jobs = [
  // Language negotiation on bare URLs.
  expect("/", 200, { lang: "en-US" }),
  expect("/", 302, { lang: "zh-CN", location: "/zh/" }),
  expect("/", 302, { lang: "zh-TW", location: "/zh-hant/" }),
  expect("/privacy/", 302, { lang: "de", location: "/de/privacy/" }),
  // Legacy URLs.
  expect("/studio", 302, { lang: "en", location: "/en/about/" }),
  expect("/ja/guide/", 308, { location: "/ja/games/" }),
  expect("/en/games/bubble-fish/", 308, { location: "/en/games/" }),
  // Static files and 404.
  expect("/fonts/pixel.css", 200),
  expect("/app-ads.txt", 200),
  expect("/this-page-does-not-exist/", 404),
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
