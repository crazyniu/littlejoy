import { address } from "../lib/languages";
import { artSlots, games } from "../lib/portfolio.mjs";
import ArtSlot from "./ArtSlot";
import { GameScene, posterItems } from "./GameFeature";
import ImageGallery from "./ImageGallery";
import Img from "./Img";
import Starfield from "./Starfield";
import { Kicker, PixelArrow, PixelSprite, SplitText, longestWord } from "./Pixel";
import { Button, CallToAction, SectionHead } from "./StudioPages";

// /{lang}/games/{slug}/: one game in depth. Hero, every store screen, the
// world, how to play and a door to the next game.
export default function GamePage({ slug, lang, copy, labels, story, show, arcade }) {
  const index = games.findIndex((g) => g.slug === slug);
  const game = games[index];
  const next = games[(index + 1) % games.length];
  const info = copy.games[slug];
  const nextInfo = copy.games[next.slug];
  const feature = copy.explore.features[slug];
  const L = copy.explore.labels;
  const posters = posterItems(game, info);
  return (
    <div className={"gd game--" + game.color}>
      <section className="gd-hero">
        <div className="gd-backdrop" aria-hidden="true">
          <img src={game.backdrop} alt="" fetchPriority="low" data-parallax="0.08" />
        </div>
        <Starfield density={0.35} />
        <div className="shell gd-layout">
          <div className="gd-copy">
            <nav className="crumbs" aria-label={copy.ui.navigation}>
              <a href={address(lang, "games")}>{story.work}</a>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{info.name}</span>
            </nav>
            <p className="game-index is-in">
              <span>0{index + 1}</span>
              {info.genre}
            </p>
            <h1 className="display gd-title" style={{ "--long": longestWord(info.name, lang) }}>
              <SplitText text={info.name} lang={lang} />
            </h1>
            <p className="gd-note">{info.note}</p>
            <dl className="game-stats" data-stagger>
              {game.stats.map(([value, key]) => (
                <div key={key} data-reveal>
                  <dd data-count={value}>{value}</dd>
                  <dt>{L[key]}</dt>
                </div>
              ))}
            </dl>
            <div className="gd-actions">
              <Button href="#screens">{arcade.screens}</Button>
              <Button href={address(lang, "games/" + next.slug)} variant="ghost">
                {copy.ui.next}
              </Button>
            </div>
          </div>
          <div className="gd-cover">
            <ImageGallery
              items={posters}
              coverOnly
              className="gd-poster"
              controls={copy.explore.preview}
              captions={false}
              sizes="(max-width: 959px) 70vw, 420px"
              priority
              tilt
            />
            <img className="mascot mascot-a" src={game.mascots[0]} alt="" />
            <img className="mascot mascot-b" src={game.mascots[1]} alt="" />
          </div>
        </div>
        <div className="pixel-edge" aria-hidden="true" />
      </section>

      <section className="gd-screens" id="screens">
        <div className="shell">
          <SectionHead kicker={copy.ui.gallery} index="01" title={arcade.screens} lang={lang} />
        </div>
        <ImageGallery
          items={posters.map(({ thumbnail, ...poster }) => poster)}
          className="screen-strip"
          controls={copy.explore.preview}
          sizes="(max-width: 720px) 62vw, 280px"
          tilt
        />
      </section>

      <section className="gd-world">
        <div className="shell gd-world-layout">
          <ArtSlot {...artSlots[slug]} alt={feature.worldTitle} sizes="(max-width: 959px) 92vw, 680px">
            <GameScene game={game} title={feature.worldTitle} />
          </ArtSlot>
          <div className="world-copy" data-stagger>
            <Kicker index="02">{L.worlds}</Kicker>
            <div data-reveal>
              <h2>
                <PixelSprite name="globe" size={3} />
                {feature.worldTitle}
              </h2>
              <p>{feature.world}</p>
            </div>
            <div data-reveal>
              <h2>
                <PixelSprite name="star" size={3} />
                {feature.collectionTitle}
              </h2>
              <p>{feature.collection}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="gd-guide">
        <div className="shell">
          <SectionHead kicker={L.guide} index="03" title={copy.ui.how} lang={lang} />
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
      </section>

      <section className="gd-next">
        <div className="shell">
          <a className={"next-card game--" + next.color} href={address(lang, "games/" + next.slug)} data-reveal>
            <Img src={"/art/covers/" + next.slug + ".webp"} alt="" sizes="200px" pixelate />
            <span className="next-copy">
              <span className="next-label">{copy.ui.next}</span>
              <span className="next-name display">{nextInfo.name}</span>
              <span className="next-genre">{nextInfo.genre}</span>
            </span>
            <PixelArrow />
          </a>
          <a className="back-link" href={address(lang, "games")}>
            ← {copy.ui.back}
          </a>
        </div>
      </section>
      <CallToAction lang={lang} labels={labels} story={story} show={show} />
    </div>
  );
}
