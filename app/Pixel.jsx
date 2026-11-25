import { palette, sprites } from "../lib/sprites";

// One <path> per colour per frame: each row is merged into runs, so even a
// large sprite is a handful of DOM nodes.
function paths(rows) {
  const byColor = new Map();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === c) end++;
      if (c !== ".") {
        byColor.set(c, (byColor.get(c) || "") + `M${x} ${y}h${end - x}v1H${x}z`);
      }
      x = end;
    }
  });
  return [...byColor].map(([c, d]) => [palette[c], d]);
}

export function PixelSprite({ name, size = 4, className = "", title }) {
  const frames = sprites[name];
  const height = frames[0].length;
  const width = frames[0][0].length;
  return (
    <svg
      className={
        "sprite sprite-" +
        name +
        (frames.length > 1 ? " sprite-frames" : "") +
        (className ? " " + className : "")
      }
      viewBox={`0 0 ${width} ${height}`}
      width={width * size}
      height={height * size}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
      focusable="false"
    >
      {frames.map((frame, i) => {
        const shapes = paths(frame).map(([fill, d]) => <path key={fill} fill={fill} d={d} />);
        return frames.length > 1 ? (
          <g key={i} className="frame">
            {shapes}
          </g>
        ) : (
          shapes
        );
      })}
    </svg>
  );
}

const segmenters = new Map();
function segment(text, lang, granularity) {
  const key = lang + granularity;
  if (!segmenters.has(key))
    segmenters.set(key, new Intl.Segmenter(lang, { granularity }));
  return [...segmenters.get(key).segment(text)].map((s) => s.segment);
}

// Length in graphemes of the longest word, so long single words (German,
// Russian) can scale the heading down instead of overflowing on phones.
export function longestWord(text, lang = "en") {
  return Math.max(
    1,
    ...segment(text, lang, "word")
      .filter((w) => !/^\s+$/.test(w))
      .map((w) => segment(w, lang, "grapheme").length),
  );
}

// Animated headline: words stay unbroken, each grapheme gets its own delay index.
export function SplitText({ text, lang = "en", start = 0, className = "" }) {
  let index = start;
  return (
    <>
      <span className="sr-only">{text}</span>
      <span className={"split " + className} aria-hidden="true">
        {segment(text, lang, "word").map((word, w) =>
          /^\s+$/.test(word) ? (
            " "
          ) : (
            <span className="split-word" key={w}>
              {segment(word, lang, "grapheme").map((ch, c) => (
                <span className="split-char" key={c} style={{ "--i": index++ }}>
                  {ch}
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    </>
  );
}

export function Kicker({ children, index }) {
  return (
    <p className="kicker" data-reveal>
      {index && <span className="kicker-index">{index}</span>}
      <span className="kicker-text" data-scramble>
        {children}
      </span>
    </p>
  );
}

export function PixelArrow() {
  return <PixelSprite name="arrow" size={3} className="btn-arrow" />;
}
