import { storePoster } from "../lib/catalog";
import { artSlots } from "../lib/portfolio.mjs";
import ArtSlot from "./ArtSlot";
import ImageGallery from "./ImageGallery";
import { PixelSprite, SplitText } from "./Pixel";

// One game, presented like a level-select screen: backdrop, poster fan,
// animated stats, and (in the full variant) the how-to-play notes.
export default function GameFeature({ game, index, lang, copy, full = false }) {
  const info = copy.games[game.slug];
  const feature = copy.explore.features[game.slug];
  const labels = copy.explore.labels;
  const posters = game.posters.map((_, j) => storePoster(game, j, info.name));
  posters.forEach((poster, j) => (poster.caption = info.captions[j] || info.name));
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
          <h3 className="game-name display">
            <SplitText text={info.name} lang={lang} />
          </h3>
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
        </div>
        <div className="game-media" data-reveal>
          <ImageGallery
            items={posters}
            limit={3}
            className="poster-fan"
            title={info.name}
            controls={copy.explore.preview}
            captions={false}
            tilt
          />
          <img
            className="mascot mascot-a"
            src={game.mascots[0]}
            alt=""
            loading="lazy"
            aria-hidden="true"
          />
          <img
            className="mascot mascot-b"
            src={game.mascots[1]}
            alt=""
            loading="lazy"
            aria-hidden="true"
          />
        </div>
      </div>
      <div className="shell game-world">
        <ArtSlot {...artSlots[game.slug]} alt={feature.worldTitle} />
        <div className="world-copy" data-stagger>
          <div data-reveal>
            <h4>
              <PixelSprite name="globe" size={3} />
              {feature.worldTitle}
            </h4>
            <p>{feature.world}</p>
          </div>
          <div data-reveal>
            <h4>
              <PixelSprite name="star" size={3} />
              {feature.collectionTitle}
            </h4>
            <p>{feature.collection}</p>
          </div>
        </div>
      </div>
      {full && (
        <div className="shell game-guide">
          <h4 className="guide-title" data-reveal>
            <PixelSprite name={game.sprite} size={3} />
            {copy.ui.how}
          </h4>
          <ol className="guide-cards" data-stagger>
            {info.guide.map(({ title, text }, i) => (
              <li key={title} data-reveal data-tilt>
                <span className="guide-step">0{i + 1}</span>
                <strong>{title}</strong>
                <p>{text}</p>
              </li>
            ))}
            <li data-reveal data-tilt className="guide-tactic">
              <span className="guide-step">
                <PixelSprite name="bulb" size={3} />
              </span>
              <strong>{feature.tacticTitle}</strong>
              <p>{feature.tactic}</p>
            </li>
          </ol>
        </div>
      )}
    </article>
  );
}
