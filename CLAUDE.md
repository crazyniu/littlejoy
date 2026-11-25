# CLAUDE.md

Littlejoy Games studio site: a Next.js static export served by the Cloudflare
Worker `littlejoy-games` (shopkivoo.com). See README.md for the overview and layout.

## Commands

```bash
npm run build      # static export → out/ (webpack; ~101 HTML pages)
npm run preview    # out/ through worker.mjs on 0.0.0.0:4173 — use this for review
npm run dev        # dev server (no worker routing; open /en/)
npm run smoke      # routing smoke test against the preview (or pass a base URL)
node scripts/cf-assets.mjs check   # dry run of the deploy bundle
```

CI (`.github/workflows/ci.yml`) runs build + smoke + check on every PR, and that
check (**Build and test**) is required by the ruleset on `main`. Merging to `main` triggers
`.github/workflows/deploy.yml`, which deploys with `scripts/cf-assets.mjs deploy` and
smoke-tests production. Don't push to `main` directly; open a PR.

Beyond the smoke test there are no tests. Verify UI changes by building, then checking pages in a browser at desktop
(1440) and mobile (390) widths. Look for horizontal overflow, console errors, and
long words in pixel headings (German and Russian are the longest).

## Architecture notes

- **Routing**: `app/[[...path]]` generates `/{lang}/{section}/` for 14 languages × 7
  routes (`lib/routes.mjs`). Bare paths such as `/` and `/about` exist only in the worker,
  which redirects them by Accept-Language. English is served in place. Legacy paths
  (`studio`, `guide`, `worlds`, `games/<slug>`) redirect with 308 or 302.
  `worker.mjs`, `lib/languages.js`, `lib/routes.mjs` and `lib/portfolio.mjs` are the
  worker's modules, so keep them free of Node/Next imports.
- **Server components by default.** Client components are `Effects`, `Starfield`,
  `SiteHeader`, `CatalogFilter`, `ImageGallery` and `LanguagePicker`. All motion runs
  from the single `Effects.jsx`, driven by data attributes:
  `data-reveal` (`up`/`wipe`/`pop`…), `data-stagger`, `data-count`, `data-words`,
  `data-fill`, `data-parallax`, `data-tilt`, `data-spy`. Add an attribute; don't add
  another observer.
- **Progressive enhancement**: the inline boot script in `layout.jsx` adds `html.js`, and
  hidden-before-reveal styles apply only under `.js`. If `Effects` hasn't set `fx-ready`
  within 3.5 s, `js` is removed, so content is never stuck invisible. Respect
  `prefers-reduced-motion` (site.css has a block at the end).
- **Pixel look**: borders are 4-direction `box-shadow`s (`--px`), not `border`. Sprites
  are string grids in `lib/sprites.js`, rendered as SVG rects by `PixelSprite`.
  Buttons use a box-shadow drop. Don't add `::before` layers with negative z-index to
  elements that get `translate`, because the layer covers the background (this was the
  bug where button text vanished on hover).
- **IntersectionObserver ignores fully clip-pathed elements.** `wipe` reveals use a
  `::before` shutter, not `clip-path`.
- `img { height: auto }` is global, so set aspect ratio with CSS, not the height attribute.

## Content and i18n

- Copy lives in `lib/locales/<lang>.json` (`ui`, `games`, `explore`),
  `lib/locales/<lang>-legal.json` (privacy, terms), `lib/site-copy.json`,
  `lib/editorial.json`, `lib/showcase.json` and `lib/concept-names.json`. Every new key
  needs all 14 languages.
- The privacy policy (`privacy` in `*-legal.json`) is deliberately generic. It covers
  Google AdMob (plus mediation or other networks such as TikTok/Pangle), ad-campaign
  attribution SDKs, and Firebase Analytics/Crashlytics without naming individual games.
  When a game adds a new SDK, check that the policy still covers it, update
  `policyUpdated` in `app/[[...path]]/page.jsx`, and add the provider to the
  `provider-links` list there. The TikTok/Pangle policy URLs were not verified, so add
  them once that SDK actually ships.
- **After adding CJK or Korean characters**, rerun `scripts/build-fonts.py` (see its
  docstring). Otherwise the glyphs are missing from the `Littlejoy Display` subset.
  The font must keep that name because the OFL reserves "Fusion Pixel".
- Thai uses `Littlejoy International`. Vietnamese headings use the Display font, because
  Silkscreen lacks the diacritics.

## Art slots

`ArtSlot` checks `public/<src>` at build time and shows a placeholder until the file
exists. Slots are listed in `artSlots` in `lib/portfolio.mjs`; README.md has the table.
To add art, drop the `.webp` at that path and rebuild. No code change is needed.

## Deploying

Worker: `littlejoy-games`. Domains: shopkivoo.com, www.shopkivoo.com. The script name,
`compatibility_date` (`2026-11-18`), the `ASSETS` binding and the assets config
(`auto-trailing-slash`, `404-page`, `run_worker_first` derived from routes) all live in
`scripts/cf-assets.mjs`. Change them there, not in the dashboard.

Normally merging to `main` deploys through GitHub Actions (secret `CLOUDFLARE_API_TOKEN`,
variable `CLOUDFLARE_ACCOUNT_ID`). With a token locally:
`npm run build && node scripts/cf-assets.mjs deploy`.

### Manual fallback: Cloudflare MCP, no API token

1. `npm run build && node scripts/cf-assets.mjs manifest`, which writes
   `deploy/manifest.json` and `deploy/assets-config.json`. `deploy/` is gitignored.
   RSC `.txt` payloads are skipped.
2. MCP `cloudflare.request` POST
   `/accounts/{account}/workers/scripts/littlejoy-games/assets-upload-session` with
   `{ manifest }`. Save the result `{ jwt, buckets }` to `deploy/session.json`.
3. `CLOUDFLARE_ACCOUNT_ID=<account> node scripts/cf-assets.mjs upload deploy/session.json`
   uploads only the missing files with the session JWT and prints the completion JWT.
   This runs locally because MCP requests always use the session's own auth. The JWTs
   expire after about 1 hour.
4. MCP PUT `/accounts/{account}/workers/scripts/littlejoy-games` as multipart `FormData`:
   - `metadata`: `{ main_module: "worker.mjs", compatibility_date, bindings: [{type:"assets",name:"ASSETS"}], assets: { jwt: <completion>, config: <assets-config.json> } }`
   - one part per module (`worker.mjs`, `lib/languages.js`, `lib/routes.mjs`,
     `lib/portfolio.mjs`), with type `application/javascript+module` and the part name
     equal to the module path.
5. Verify: `npm run smoke -- https://shopkivoo.com`, then open a page in a browser and
   check that the console is clean.
