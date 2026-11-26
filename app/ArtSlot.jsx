import { existsSync } from "node:fs";
import { join } from "node:path";
import Img from "./Img";
import { PixelSprite } from "./Pixel";

// Reserved spot for artwork that has not been drawn yet. Drop a file at `src`
// (under /public), run `npm run images` and the next build shows it with a
// srcset and the depixelate reveal. Until then production builds render
// `children` (a fallback scene); the dev server shows a labelled frame.
export default function ArtSlot({
  src,
  width,
  height,
  alt = "",
  className = "",
  sizes = "(max-width: 959px) 92vw, 640px",
  priority = false,
  children,
}) {
  const ready = existsSync(join(process.cwd(), "public", src));
  if (ready) {
    return (
      <div className={"art-frame " + className} data-reveal="wipe">
        <Img src={src} alt={alt} sizes={sizes} priority={priority} pixelate />
      </div>
    );
  }
  if (children && process.env.NODE_ENV === "production") return children;
  return (
    <div
      className={"art-frame art-slot " + className}
      style={{ aspectRatio: width + " / " + height }}
      data-reveal="wipe"
      aria-hidden="true"
    >
      <div className="art-slot-noise" />
      <div className="art-slot-body">
        <PixelSprite name="pad" size={5} />
        <strong>ART SLOT</strong>
        <code>public{src}</code>
        <small>
          {width} × {height}
        </small>
      </div>
    </div>
  );
}
