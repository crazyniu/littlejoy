import { palette, sprites } from "../lib/sprites";

// Merge each row into runs of one colour so a sprite stays a handful of <rect>s.
function runs(rows) {
  const rects = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === c) end++;
      if (c !== ".") rects.push([x, y, end - x, palette[c]]);
      x = end;
    }
  });
  return rects;
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
      {frames.map((frame, i) => (
        <g key={i} className={frames.length > 1 ? "frame" : undefined}>
          {runs(frame).map(([x, y, w, fill]) => (
            <rect key={x + "-" + y} x={x} y={y} width={w} height="1" fill={fill} />
          ))}
        </g>
      ))}
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
      <span className="kicker-text">{children}</span>
    </p>
  );
}

export function PixelArrow() {
  return <PixelSprite name="arrow" size={3} className="btn-arrow" />;
}
