import { address, languages } from "../lib/languages";
import Img from "./Img";
import PageBanner from "./PageBanner";
import Starfield from "./Starfield";
import { Kicker, PixelArrow, PixelSprite, SplitText } from "./Pixel";
import { Button } from "./StudioPages";

// /{lang}/play/: Tiny Flock. The board is built by public/play.js.
export function PlayPage({ lang, copy, arcade }) {
  const flyHome = copy.games["fly-home"];
  const strings = {
    colors: arcade.colors,
    branch: arcade.branch,
    empty: arcade.empty,
    clear: arcade.clear,
    stuck: arcade.stuck,
  };
  return (
    <>
      <PageBanner
        lang={lang}
        kicker={arcade.playKicker}
        title={arcade.playTitle}
        intro={arcade.playIntro}
        sprite="pad"
        compact
      />
      <section className="arcade">
        <div className="shell arcade-layout">
          <div className="flock" data-flock data-copy={JSON.stringify(strings)} data-no-sparks>
            <div className="flock-hud">
              <p>
                <span>{arcade.level}</span>
                <strong data-level>1</strong>
              </p>
              <p>
                <span>{arcade.moves}</span>
                <strong data-moves>0</strong>
              </p>
              <div className="flock-tools">
                <button type="button" className="flock-btn" data-undo disabled>
                  <span aria-hidden="true">↶</span> {arcade.undo}
                </button>
                <button type="button" className="flock-btn" data-restart>
                  <span aria-hidden="true">↻</span> {arcade.restart}
                </button>
              </div>
            </div>
            <div className="flock-stage">
              <div className="flock-board" role="group" aria-label={arcade.board} />
              <noscript>
                <p className="flock-nojs">
                  <PixelSprite name="pad" size={4} />
                  {arcade.nojs}
                </p>
              </noscript>
              <div className="flock-clear" hidden>
                <PixelSprite name="star" size={6} />
                <p className="flock-clear-title display">{arcade.clear}</p>
                <p className="flock-clear-moves">
                  {arcade.moves} <strong data-clear-moves>0</strong>
                </p>
                <button type="button" className="btn" data-next>
                  <span className="btn-label">{arcade.next}</span>
                  <PixelArrow />
                </button>
              </div>
            </div>
            <p className="flock-status" role="status" />
          </div>
          <aside className="arcade-side">
            <Kicker index="?">{copy.ui.how}</Kicker>
            <ol className="rule-list" data-stagger>
              {arcade.rules.map((rule, i) => (
                <li key={rule} data-reveal>
                  <span className="rule-no">0{i + 1}</span>
                  {rule}
                </li>
              ))}
            </ol>
            <a className="next-card game--leaf" href={address(lang, "games/fly-home")} data-reveal>
              <Img src="/art/covers/fly-home.webp" alt="" sizes="120px" />
              <span className="next-copy">
                <span className="next-label">{flyHome.genre}</span>
                <span className="next-name display">{flyHome.name}</span>
                <span className="next-genre">{copy.explore.labels.open}</span>
              </span>
              <PixelArrow />
            </a>
          </aside>
        </div>
      </section>
    </>
  );
}

// The 404 page ("lost" route, copied to /404.html after the build).
export function LostPage({ arcade, copy }) {
  return (
    <section className="lost">
      <Starfield critters />
      <div className="shell lost-inner">
        <p className="lost-code" aria-hidden="true">
          404
        </p>
        <h1 className="display lost-title">
          <SplitText text={arcade.lostTitle} />
        </h1>
        <p className="lost-text">{arcade.lostText}</p>
        <p className="lost-continue" data-continue aria-hidden="true">
          CONTINUE? <strong data-countdown>9</strong>
        </p>
        <div className="lost-actions">
          <Button href="/">{arcade.lostCta}</Button>
          <Button href="/games/" variant="ghost" arrow={false}>
            <PixelSprite name="pad" size={2} /> {copy.ui.browse}
          </Button>
        </div>
        <ul className="lost-langs">
          {Object.entries(languages).map(([code, { name, tag }]) => (
            <li key={code}>
              <a href={address(code)} lang={tag} hrefLang={tag}>
                {name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
