// Generates responsive variants and pixel-mosaic placeholders for the artwork
// in public/art, plus the social preview image. The output is committed, so
// the site build itself never needs sharp:
//
//   npm run images      (after adding or replacing artwork)
//
// Writes public/art/r/** (smaller widths), public/og.jpg and lib/images.json,
// which <Img> reads for width/height, srcset and the mosaic placeholder.
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, sep } from "node:path";
import sharp from "sharp";

const ROOT = join(import.meta.dirname, "..");
const PUBLIC = join(ROOT, "public");
const ART = join(PUBLIC, "art");
const OUT = join(ART, "r");

// Widths to generate per folder (only those smaller than the source).
const widths = {
  store: [480, 720],
  covers: [360],
  site: [640],
  slots: [640, 1024, 1400],
  "": [640],
};
// Folders whose images get a mosaic placeholder for the depixelate reveal.
const mosaic = new Set(["store", "covers", "site", "slots"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => {
      const path = join(dir, e.name);
      if (e.isDirectory()) return path === OUT ? [] : walk(path);
      return e.name.endsWith(".webp") ? [path] : [];
    }),
  );
  return files.flat();
}

const manifest = {};
for (const file of (await walk(ART)).sort()) {
  const src = "/" + relative(PUBLIC, file).split(sep).join("/");
  const folder = relative(ART, dirname(file)).split(sep)[0] || "";
  const image = sharp(file);
  const { width, height } = await image.metadata();
  const entry = { w: width, h: height };

  const set = [];
  for (const w of widths[folder] ?? []) {
    if (w >= width) continue;
    const target = join(OUT, folder, basename(file, ".webp") + "-" + w + ".webp");
    await mkdir(dirname(target), { recursive: true });
    await sharp(file).resize({ width: w }).webp({ quality: 80, effort: 6 }).toFile(target);
    set.push([w, "/" + relative(PUBLIC, target).split(sep).join("/")]);
  }
  if (set.length) entry.set = set;

  if (mosaic.has(folder)) {
    // ~12 px across: drawn with image-rendering: pixelated, it reads as a
    // chunky mosaic while the real image loads.
    const cols = 12;
    const rows = Math.max(1, Math.round((cols * height) / width));
    const tiny = await sharp(file)
      .resize(cols, rows, { kernel: "cubic" })
      .webp({ quality: 60 })
      .toBuffer();
    entry.lqip = "data:image/webp;base64," + tiny.toString("base64");
  }
  manifest[src] = entry;
}

await writeFile(join(ROOT, "lib", "images.json"), JSON.stringify(manifest, null, 1) + "\n");

// 1200×630 social card from the hero island.
await sharp(join(ART, "site", "island.webp"))
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(join(PUBLIC, "og.jpg"));

console.log(`${Object.keys(manifest).length} images → lib/images.json, public/art/r, public/og.jpg`);
