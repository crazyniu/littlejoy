import Starfield from "./Starfield";
import { PixelSprite, SplitText } from "./Pixel";

export default function PageBanner({
  lang = "en",
  kicker,
  title,
  intro,
  children,
  artwork,
  sprite,
  compact = false,
}) {
  return (
    <header className={"banner" + (compact ? " banner--compact" : "")}>
      <Starfield density={0.7} />
      <div className="banner-grid" aria-hidden="true" />
      <div className={"shell banner-inner" + (artwork ? " banner-inner--art" : "")}>
        <div className="banner-copy">
          {kicker && (
            <p className="kicker is-in">
              {sprite && <PixelSprite name={sprite} size={3} />}
              <span className="kicker-text">{kicker}</span>
            </p>
          )}
          <h1 className="display banner-title">
            <SplitText text={title} lang={lang} />
          </h1>
          {intro && <p className="banner-intro">{intro}</p>}
          {children && <div className="banner-extra">{children}</div>}
        </div>
        {artwork && <div className="banner-art">{artwork}</div>}
      </div>
      <div className="pixel-edge" aria-hidden="true" />
    </header>
  );
}
