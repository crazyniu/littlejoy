import { concepts, games, totals } from "../lib/portfolio.mjs";
import conceptNames from "../lib/concept-names.json";
import CatalogFilter from "./CatalogFilter";
import GameFeature from "./GameFeature";
import ImageGallery from "./ImageGallery";
import PageBanner from "./PageBanner";
import { CallToAction, SectionHead } from "./StudioPages";

export default function Portfolio({ lang, copy, story, show, labels }) {
  const names = conceptNames[lang].names;
  const heading = conceptNames[lang].heading;
  return (
    <>
      <PageBanner
        lang={lang}
        kicker={copy.explore.labels.catalog}
        title={story.work}
        intro={story.catalog}
        sprite="pad"
      >
        <dl className="banner-stats">
          <div>
            <dd>{games.length}</dd>
            <dt>{copy.ui.works}</dt>
          </div>
          <div>
            <dd>{concepts.length}</dd>
            <dt>{heading}</dt>
          </div>
          <div>
            <dd>{totals.levels}</dd>
            <dt>{copy.explore.labels.levels}</dt>
          </div>
        </dl>
      </PageBanner>
      <div className="catalog" data-catalog data-filter="all">
        <CatalogFilter
          options={[
            ["all", show.all, games.length + concepts.length],
            ["games", copy.ui.works, games.length],
            ["concepts", heading, concepts.length],
          ]}
        />
        <section className="games-showcase" data-group="games">
          {games.map((game, i) => (
            <GameFeature key={game.slug} game={game} index={i} lang={lang} copy={copy} full />
          ))}
        </section>
        <section className="concept-gallery" data-group="concepts">
          <div className="shell">
            <SectionHead
              kicker={heading}
              index={String(concepts.length)}
              title={story.ideaTitle}
              text={story.ideaText}
              lang={lang}
            />
            <ul className="concept-grid" data-stagger>
              {concepts.map((slug, i) => (
                <li key={slug} id={slug} className="concept-tile" data-reveal>
                  <ImageGallery
                    items={[
                      {
                        src: "/art/covers/" + slug + ".webp",
                        caption: names[i],
                        width: 418,
                        height: 627,
                      },
                    ]}
                    title={names[i]}
                    controls={copy.explore.preview}
                    captions={false}
                    coverOnly
                    tilt
                  />
                  <div className="concept-meta">
                    <span className="concept-no">{String(i + 1).padStart(2, "0")}</span>
                    <h3>{names[i]}</h3>
                    <span className="concept-tag">{story.conceptTag}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      <CallToAction lang={lang} labels={labels} story={story} show={show} />
    </>
  );
}
