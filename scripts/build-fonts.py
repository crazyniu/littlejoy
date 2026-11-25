#!/usr/bin/env python3
"""Rebuild the Littlejoy Display pixel font from the full Fusion Pixel font.

The site serves subsets containing only the characters that appear in the
copy (lib/**/*.json, app/**/*.jsx). Run this after adding or editing text in
any language, otherwise new CJK/Korean glyphs fall back to a system font.

Two files are written, split at U+2E80 so Latin/Cyrillic/Vietnamese pages never
download the CJK glyphs (site.css declares matching unicode-range values):
  public/fonts/littlejoy-display.woff2      U+0000-2E7F
  public/fonts/littlejoy-display-cjk.woff2  U+2E80-FFFF

Usage:
  pip install fonttools brotli
  # download fusion-pixel-font-12px-proportional-woff2-v2024.05.12.zip from
  # https://github.com/TakWolf/fusion-pixel-font/releases and unzip it
  python3 scripts/build-fonts.py path/to/fusion-pixel-12px-proportional-zh_hans.woff2

The OFL reserves the name "Fusion Pixel", so the subset is renamed to
"Littlejoy Display" (see public/fonts/Littlejoy-Display-OFL.txt).
"""
import glob
import json
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "public" / "fonts"
SPLIT = 0x2E80
FAMILY = "Littlejoy Display"


def collect_text():
    chars = set()

    def walk(value):
        if isinstance(value, str):
            chars.update(value)
        elif isinstance(value, dict):
            for v in value.values():
                walk(v)
        elif isinstance(value, list):
            for v in value:
                walk(v)

    for path in glob.glob(str(ROOT / "lib" / "**" / "*.json"), recursive=True):
        walk(json.loads(Path(path).read_text(encoding="utf-8")))
    for path in glob.glob(str(ROOT / "app" / "**" / "*.jsx"), recursive=True):
        chars.update(Path(path).read_text(encoding="utf-8"))
    for path in glob.glob(str(ROOT / "lib" / "*.js")):
        chars.update(Path(path).read_text(encoding="utf-8"))
    for path in glob.glob(str(ROOT / "public" / "*.js")):
        chars.update(Path(path).read_text(encoding="utf-8"))
    # Printable ASCII, Latin-1 and punctuation commonly used in copy.
    chars.update(chr(c) for c in range(0x20, 0x7F))
    chars.update(chr(c) for c in range(0xA0, 0x180))
    chars.update("‘’“”–—…·•→←↑↓↗▶▮✦✉★☆♥「」『』【】《》〈〉、。・ー～！？：；，（）")
    return "".join(sorted(c for c in chars if c.isprintable() or c == " "))


def build(source, text, out):
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    font = TTFont(source)
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)

    name = font["name"]
    for record in name.names:
        if record.nameID in (1, 3, 4, 16):
            record.string = FAMILY
        elif record.nameID == 6:
            record.string = FAMILY.replace(" ", "")
        elif record.nameID == 2:
            record.string = "Regular"
    font.flavor = "woff2"
    font.save(out)
    cmap = font.getBestCmap()
    print(f"{out.relative_to(ROOT)}: {len(cmap)} glyphs, {out.stat().st_size // 1024} KiB")


def main(source):
    text = collect_text()
    build(source, "".join(c for c in text if ord(c) < SPLIT), FONTS / "littlejoy-display.woff2")
    build(source, "".join(c for c in text if ord(c) >= SPLIT), FONTS / "littlejoy-display-cjk.woff2")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
