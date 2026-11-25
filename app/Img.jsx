import images from "../lib/images.json";

// <img> with the intrinsic size, responsive srcset and (with `pixelate`) a
// 12-pixel mosaic placeholder that site.js "depixelates" into the artwork
// when it scrolls into view. Sizes come from lib/images.json (npm run images).
export default function Img({
  src,
  alt = "",
  sizes = "100vw",
  priority = false,
  pixelate = false,
  className,
  style,
  ...rest
}) {
  const meta = images[src] ?? {};
  const srcSet = meta.set
    ? [...meta.set.map(([w, path]) => `${path} ${w}w`), `${src} ${meta.w}w`].join(", ")
    : undefined;
  const mosaic = pixelate && meta.lqip;
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      width={meta.w}
      height={meta.h}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? undefined : "async"}
      fetchPriority={priority ? "high" : undefined}
      className={className}
      style={mosaic ? { ...style, backgroundImage: `url(${meta.lqip})` } : style}
      data-pixelate={mosaic ? "" : undefined}
      {...rest}
    />
  );
}

// Gallery data for the lightbox: [{ src, caption }].
export function galleryData(items) {
  return JSON.stringify(items.map(({ src, caption }) => ({ src, caption })));
}
