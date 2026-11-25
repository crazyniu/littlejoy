import { existsSync } from "node:fs";
import { join } from "node:path";
import { PixelSprite } from "./Pixel";

// Reserved spot for artwork that has not been drawn yet. Drop a file at `src`
// (under /public) and the next build shows it instead of the placeholder.
export default function ArtSlot({
  src,
  width,
  height,
  alt = "",
  className = "",
  priority = false,
}) {
  const ready = existsSync(join(process.cwd(), "public", src));
  if (ready) {
    return (
      <div className={"art-frame " + className} data-reveal="wipe">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
        />
      </div>
    );
  }
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
