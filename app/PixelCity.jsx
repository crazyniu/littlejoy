// A procedural pixel-art Los Angeles evening: banded sunset sky, striped
// sun, hills, downtown towers with lit windows, palms and a boulevard.
// Generated at build time from a fixed seed, so the markup is stable.
const W = 320;
const H = 136;

function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export default function PixelCity({ label }) {
  const rand = seeded(20260518);
  const layers = new Map();
  const rect = (color, x, y, w, h) =>
    layers.set(color, (layers.get(color) || "") + `M${x} ${y}h${w}v${h}h${-w}z`);

  // Sky bands.
  const sky = ["#1b1040", "#2a1650", "#40205f", "#5c2a6e", "#7d3274", "#a23d78", "#c84f74", "#ea6a6a", "#ff8a5c", "#ffb04f"];
  sky.forEach((c, i) => rect(c, 0, i * 8, W, 8));

  // Sun: a disc with retro gaps in its lower half.
  const cx = 214;
  const cy = 74;
  const r = 30;
  for (let y = -r; y <= 0; y += 2) {
    const half = Math.round(Math.sqrt(r * r - y * y));
    const gap = y > -14 && (Math.floor((y + 14) / 4) % 2 === 1 || y > -3);
    if (!gap) rect(y < -18 ? "#ffe27a" : "#ffd54b", cx - half, cy + y, half * 2, 2);
  }

  // Hills.
  let hill = 64;
  for (let x = 0; x < W; x += 4) {
    hill += Math.round((rand() - 0.5) * 6);
    hill = Math.min(76, Math.max(54, hill));
    rect("#4a2a6e", x, hill, 4, H - hill);
  }

  // Towers (downtown sits right of centre).
  const windows = [];
  let x = 4;
  while (x < W - 4) {
    const downtown = x > 120 && x < 250;
    const w = 8 + Math.floor(rand() * (downtown ? 12 : 8));
    const h = downtown ? 26 + Math.floor(rand() * 40) : 10 + Math.floor(rand() * 18);
    const top = 96 - h;
    rect(downtown ? "#24134a" : "#2d1856", x, top, w, H - top);
    if (downtown && h > 40) rect("#24134a", x + Math.floor(w / 2) - 1, top - 6, 2, 6);
    for (let wy = top + 3; wy < 92; wy += 5)
      for (let wx = x + 2; wx < x + w - 2; wx += 3)
        if (rand() < 0.28) windows.push([wx, wy]);
    x += w + (downtown ? 1 : 2 + Math.floor(rand() * 4));
  }

  // Street.
  rect("#150b30", 0, 96, W, H - 96);
  rect("#ff5d8f", 0, 96, W, 1);
  for (let sx = 6; sx < W; sx += 20) rect("#ffd54b", sx, 116, 10, 2);

  // Palms.
  const palm = (px, height) => {
    const base = 118;
    for (let i = 0; i < height; i += 2) {
      const lean = Math.round(Math.sin(i / height) * 3);
      rect("#120826", px + lean, base - i, 2, 2);
    }
    const top = base - height;
    const tx = px + Math.round(Math.sin(1) * 3);
    const fronds = [
      [-1, 0], [-2, 1], [-3, 2], [-4, 3], [1, 0], [2, 1], [3, 2], [4, 3],
      [-1, -1], [1, -1], [0, -2], [-2, 0], [2, 0], [-5, 4], [5, 4],
    ];
    fronds.forEach(([fx, fy]) => rect("#120826", tx + fx * 2, top + fy * 2, 2, 2));
  };
  [18, 58, 96, 268, 302].forEach((px, i) => palm(px, 44 + ((i * 7) % 16)));

  return (
    <div className="pixel-city art-frame" role="img" aria-label={label} data-reveal="wipe">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges" aria-hidden="true">
        {[...layers].map(([fill, d]) => (
          <path key={fill} fill={fill} d={d} />
        ))}
        <g className="city-windows">
          {[0, 1, 2].map((group) => (
            <path
              key={group}
              className={"city-win city-win--" + group}
              fill={group === 2 ? "#5fd3ff" : "#ffd54b"}
              d={windows
                .filter((_, i) => i % 3 === group)
                .map(([wx, wy]) => `M${wx} ${wy}h1v2h-1z`)
                .join("")}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
