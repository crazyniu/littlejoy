import { address } from "../lib/languages";
import { storePoster } from "../lib/catalog";
import ImageGallery from "./ImageGallery";
import { PixelArrow, PixelSprite, SplitText } from "./Pixel";

// Store posters for a game, captioned, first one with its cover thumbnail.
export function posterItems(game, info) {
  return game.posters.map((_, j) => storePoster(game, j, info.captions[j] || info.name));
}

// One game, presented like a level-select screen: backdrop, poster fan,
// animated stats and a link to the game's own page.
export default function GameFeature({ game, index, lang, copy, heading = "h3" }) {
  const info = copy.games[game.slug];
  const labels = copy.explore.labels;
  const Name = heading;
  const href = address(lang, "games/" + game.slug);
  return (
    <article className={"game game--" + game.color} id={game.slug}>
      <div className="game-backdrop" aria-hidden="true">
        <img src={game.backdrop} alt="" loading="lazy" data-parallax="-0.12" />
      </div>
      <div className="shell game-layout">
        <div className="game-info">
          <p className="game-index" data-reveal>
            <span>0{index + 1}</span>
            {info.genre}
          </p>
          <Name className="game-name display">
            <a href={href}>
              <SplitText text={info.name} lang={lang} />
            </a>
          </Name>
          <p className="game-note" data-reveal>
            {info.note}
          </p>
          <dl className="game-stats" data-stagger>
            {game.stats.map(([value, key]) => (
              <div key={key} data-reveal>
                <dd data-count={value}>{value}</dd>
                <dt>{labels[key]}</dt>
              </div>
            ))}
          </dl>
          <a className="game-more" href={href} data-reveal>
            <span>
              {labels.open} · {info.name}
            </span>
            <PixelArrow />
          </a>
        </div>
        <div className="game-media" data-reveal>
          <ImageGallery
            items={posterItems(game, info)}
            limit={3}
            className="poster-fan"
            controls={copy.explore.preview}
            captions={false}
            sizes="(max-width: 720px) 46vw, 300px"
            tilt
          />
          <img className="mascot mascot-a" src={game.mascots[0]} alt="" loading="lazy" />
          <img className="mascot mascot-b" src={game.mascots[1]} alt="" loading="lazy" />
        </div>
      </div>
    </article>
  );
}

// Fallback for the key-art slot: the game's backdrop with a level-select map
// drawn over it in pixels, and the mascot standing on the current level.
export function GameScene({ game, title }) {
  const count = 7;
  const nodes = Array.from({ length: count }, (_, i) => [
    Math.round(14 + (i * 132) / (count - 1)),
    Math.round(48 + Math.sin(i * 1.25 + 0.4) * 20),
  ]);
  const dots = [];
  nodes.slice(1).forEach(([x2, y2], i) => {
    const [x1, y1] = nodes[i];
    const steps = Math.round(Math.hypot(x2 - x1, y2 - y1) / 4);
    for (let s = 1; s < steps; s++) {
      dots.push([Math.round(x1 + ((x2 - x1) * s) / steps), Math.round(y1 + ((y2 - y1) * s) / steps)]);
    }
  });
  const current = 3;
  const [mx, my] = nodes[current];
  return (
    <div className={"art-frame game-scene game--" + game.color} data-reveal="wipe">
      <img className="game-scene-bg" src={game.backdrop} alt="" loading="lazy" />
      <svg className="game-scene-map" viewBox="0 0 160 90" shapeRendering="crispEdges" aria-hidden="true">
        <path
          fill="#ffffff"
          fillOpacity="0.75"
          d={dots.map(([x, y], i) => (i % 2 ? "" : `M${x} ${y}h2v2h-2z`)).join("")}
        />
        {nodes.map(([x, y], i) => (
          <g key={i} className={i < current ? "node done" : i === current ? "node now" : "node"}>
            <rect x={x - 4} y={y - 4} width="8" height="8" fill="#1a1230" />
            <rect x={x - 3} y={y - 3} width="6" height="6" />
          </g>
        ))}
      </svg>
      <img
        className="game-scene-mascot"
        src={game.mascots[0]}
        alt=""
        loading="lazy"
        style={{ left: (mx / 160) * 100 + "%", top: (my / 90) * 100 + "%" }}
      />
      <p className="game-scene-chip">
        <PixelSprite name={game.sprite} size={2} />
        {title}
      </p>
    </div>
  );
}
