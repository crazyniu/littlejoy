"use client";
import { useId, useRef, useState } from "react";

export default function ImageGallery({
  items,
  title,
  controls,
  className = "",
  priority = false,
  captions = true,
  coverOnly = false,
  children,
}) {
  const dialog = useRef(null);
  const swipe = useRef(null);
  const description = useId();
  const [index, setIndex] = useState(0);
  const selected = items[index];
  const multiple = items.length > 1;
  function step(delta) {
    setIndex((current) => (current + delta + items.length) % items.length);
  }
  function open(i, trigger) {
    trigger.focus({ preventScroll: true });
    setIndex(i);
    dialog.current.showModal();
  }
  return (
    <>
      <div className={"image-gallery " + className}>
        {(coverOnly ? items.slice(0, 1) : items).map((item, i) => {
          const thumb = item.thumbnail ?? item;
          return (
            <figure key={item.src}>
              <button
                type="button"
                className="image-trigger"
                aria-haspopup="dialog"
                aria-label={controls.open + " · " + item.caption}
                onClick={(event) => open(i, event.currentTarget)}
              >
                {children || (
                  <img
                    src={thumb.src}
                    alt={item.caption}
                    width={thumb.width}
                    height={thumb.height}
                    loading={priority && i === 0 ? "eager" : "lazy"}
                    fetchPriority={priority && i === 0 ? "high" : undefined}
                  />
                )}
                <span className="enlarge" aria-hidden="true">
                  ⤢
                </span>
              </button>
              {captions && <figcaption>{item.caption}</figcaption>}
            </figure>
          );
        })}
      </div>
      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={title}
        aria-describedby={description}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current.close();
        }}
        onKeyDown={(e) => {
          if (!multiple) return;
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            step(e.key === "ArrowRight" ? 1 : -1);
          }
        }}
      >
        <div className="lightbox-inner">
          <button
            className="lightbox-close"
            type="button"
            autoFocus
            onClick={() => dialog.current.close()}
            aria-label={controls.close}
          >
            ×
          </button>
          <div
            className="lightbox-stage"
            onTouchStart={(e) => {
              const touch = e.touches[0];
              swipe.current =
                e.touches.length === 1 ? [touch.clientX, touch.clientY] : null;
            }}
            onTouchCancel={() => {
              swipe.current = null;
            }}
            onTouchEnd={(e) => {
              const start = swipe.current;
              swipe.current = null;
              if (!multiple || !start || e.touches.length) return;
              const touch = e.changedTouches[0];
              const dx = touch.clientX - start[0],
                dy = touch.clientY - start[1];
              if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5)
                step(dx < 0 ? 1 : -1);
            }}
          >
            <img
              key={selected.src}
              src={selected.src}
              alt={selected.caption}
              loading="lazy"
            />
          </div>
          <div className="lightbox-toolbar">
            {multiple && (
              <button
                type="button"
                aria-label={controls.previous}
                onClick={() => step(-1)}
              >
                ←
              </button>
            )}
            <p id={description} aria-live="polite">
              {selected.caption}
              {multiple && (
                <small>
                  {index + 1} / {items.length}
                </small>
              )}
            </p>
            {multiple && (
              <button
                type="button"
                aria-label={controls.next}
                onClick={() => step(1)}
              >
                →
              </button>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
