import Img, { galleryData } from "./Img";

// Thumbnails that open the shared #lightbox (site.js). Each thumbnail is a
// real link to the full image, so the gallery works without scripts too.
export default function ImageGallery({
  items,
  controls,
  className = "",
  priority = false,
  captions = true,
  coverOnly = false,
  limit,
  tilt = false,
  sizes = "(max-width: 720px) 60vw, 360px",
}) {
  return (
    <div className={"image-gallery " + className} data-gallery={galleryData(items)}>
      {items.slice(0, coverOnly ? 1 : (limit ?? items.length)).map((item, i) => {
        const thumb = item.thumbnail ?? item;
        return (
          <figure key={item.src} data-tilt={tilt ? "holo" : undefined} style={{ "--n": i }}>
            <a
              className="image-trigger"
              href={item.src}
              data-lightbox={i}
              aria-label={controls.open + " · " + item.caption}
            >
              <Img
                src={thumb.src}
                alt={item.caption}
                sizes={sizes}
                priority={priority && i === 0}
                pixelate
              />
              <span className="enlarge" aria-hidden="true">
                +
              </span>
            </a>
            {captions && <figcaption>{item.caption}</figcaption>}
          </figure>
        );
      })}
    </div>
  );
}

// One dialog per page, filled in by site.js.
export function Lightbox({ controls }) {
  return (
    <dialog id="lightbox" className="lightbox" aria-label={controls.open}>
      <div className="lightbox-inner">
        <button className="lightbox-close" type="button" data-close aria-label={controls.close}>
          ×
        </button>
        <div className="lightbox-stage">
          <img alt="" />
        </div>
        <div className="lightbox-toolbar">
          <button type="button" data-step="-1" aria-label={controls.previous}>
            ←
          </button>
          <p aria-live="polite">
            <span data-caption />
            <small data-counter />
          </p>
          <button type="button" data-step="1" aria-label={controls.next}>
            →
          </button>
        </div>
      </div>
    </dialog>
  );
}
