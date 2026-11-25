# Littlejoy Games — studio website

Official site of Littlejoy Games, a small indie mobile game studio in Los Angeles.
Live at **https://shopkivoo.com** (and `www.shopkivoo.com`).

A pixel-art, arcade-themed static site with heavy motion: a boot screen, a
canvas starfield, split-letter title reveals, scroll-linked effects, tilt cards,
a poster fan per game, and marquees. Everything is server-rendered HTML, so
the site still works with JavaScript off or with reduced motion turned on.

- **14 languages**: en, zh, zh-hant, ja, ko, vi, th, id, fr, de, es, it, pt-br, ru
- **7 pages per language**: home, games, about, contact, support, privacy, terms
- **Mobile-first layout**: a full-screen pixel menu below 960 px

## Stack

| Part | What |
| --- | --- |
| Framework | Next.js 16 (`output: "export"`), React 19 |
| Hosting | Cloudflare Worker `littlejoy-games` with static assets |
| Routing | `worker.mjs`: picks the language from Accept-Language and redirects legacy URLs |
| Styles | One stylesheet, `app/site.css` (no CSS framework) |
| Fonts | Silkscreen (Latin pixel), Littlejoy Display (CJK/Korean pixel, a Fusion Pixel subset), Littlejoy International (Thai) |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000/en/
npm run build      # static export to out/
npm run preview    # serves out/ through worker.mjs on 0.0.0.0:4173 (LAN-reachable)
```

`npm run preview` runs the real worker routing, so language redirects and
legacy URLs behave the same way they do in production. Use `PORT=8080` to
change the port.

## Project layout

```
app/
  [[...path]]/page.jsx   every route: header, footer, boot screen, legal document pages
  [[...path]]/layout.jsx <html>, the boot script, site.css
  StudioPages.jsx        home, about, contact, support
  Portfolio.jsx          games page (games + concept catalog with filter)
  GameFeature.jsx        one game panel (stats, poster fan, world, guide)
  PageBanner.jsx         page hero banner
  SiteHeader.jsx         nav + mobile menu (client)
  Effects.jsx            all scroll/pointer motion (client, one component)
  Starfield.jsx          canvas starfield (client)
  Pixel.jsx              PixelSprite, SplitText, Kicker
  ArtSlot.jsx            image, or a placeholder until the art exists
  ImageGallery.jsx       gallery + lightbox
  site.css               the whole design system
  fonts/pixel.css/       route that emits @font-face rules
lib/
  locales/<lang>.json        UI strings, game copy, guides
  locales/<lang>-legal.json  privacy policy and terms
  site-copy.json             nav labels and page intros
  editorial.json             studio copy (about, teaser, catalog)
  showcase.json              redesign copy: hero, pillars, FAQ, glance cards…
  concept-names.json         names for the 18 concept titles
  portfolio.mjs              games, concepts, stats, art slots
  sprites.js                 pixel sprites as string grids
  languages.js, routes.mjs   languages and routes (shared with the worker)
public/                      images, fonts, cursors, app-ads.txt
scripts/
  preview.mjs                LAN preview server
  cf-assets.mjs              Cloudflare asset manifest + upload helper
  build-fonts.py             rebuilds the CJK pixel font subset
worker.mjs                   Cloudflare Worker entry
```

## Editing content

All copy lives in `lib/`. Each JSON file has one key per language. **Add new
strings to all 14 languages.** If you add CJK or Korean text, rebuild the
font subset, otherwise the new glyphs fall back to a system font:

```bash
pip install fonttools brotli
python3 scripts/build-fonts.py path/to/fusion-pixel-12px-proportional-zh_hans.woff2
```

The full font is in the `fusion-pixel-font-12px-proportional-woff2-v2024.05.12`
release at https://github.com/TakWolf/fusion-pixel-font/releases.

## Art slots (artwork still to be made)

Some sections show a striped **ART SLOT** frame instead of an image. To fill one,
export the image at the size below, save it at the path shown, and rebuild. The
frame is replaced automatically.

| Slot | Path in `public/` | Size |
| --- | --- | --- |
| Bubble Fish key art | `art/slots/bubble-fish-keyart.webp` | 1600×900 |
| Fly Home key art | `art/slots/fly-home-keyart.webp` | 1600×900 |
| Team portrait (About) | `art/slots/team-portrait.webp` | 1200×900 |
| Los Angeles skyline (About) | `art/slots/los-angeles-skyline.webp` | 2100×900 |

The list is in `artSlots` in `lib/portfolio.mjs`.

## Tests

```bash
npm run build
npm run preview &                 # serves out/ on :4173
npm run smoke                     # 108 routing checks against the preview
npm run smoke -- https://shopkivoo.com   # same checks against production
node scripts/cf-assets.mjs check  # dry run of the deploy bundle
```

## CI/CD (GitHub Actions)

| Workflow | Runs on | What it does |
| --- | --- | --- |
| `CI` (`.github/workflows/ci.yml`) | every pull request | `npm ci` → build → routing smoke test → deploy bundle check |
| `Deploy` (`.github/workflows/deploy.yml`) | push to `main`, or run manually | the same checks, then deploys to Cloudflare and smoke-tests production |

`main` is protected by the ruleset in `.github/rulesets/default-branch.json`:
changes land through pull requests, and the **Build and test** check must pass.
Dependabot (`.github/dependabot.yml`) opens monthly update PRs for npm packages
and GitHub Actions.

Deploying needs two settings in the repository (Settings → Secrets and variables → Actions):

| Name | Kind | Value |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | variable | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | secret | API token with **Account → Workers Scripts → Edit** |

Without the token the Deploy workflow still builds and tests, but it skips the
deploy step and shows a warning.

To deploy by hand with a token:
`CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… node scripts/cf-assets.mjs deploy`
(after `npm run build`). CLAUDE.md describes the route without a token, through the Cloudflare MCP.

## Licenses

Fonts are under the SIL Open Font License; see `public/fonts/*-OFL.txt`.
Flag icon credits are in `public/flags/CREDITS.txt`.
