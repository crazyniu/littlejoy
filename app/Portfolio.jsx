import { storePoster } from "../lib/catalog";
import { concepts, games } from "../lib/portfolio.mjs";
import conceptNames from "../lib/concept-names.json";
import ImageGallery from "./ImageGallery";
import PageBanner from "./PageBanner";

export default function Portfolio({ lang, copy, story }) {
  const originalNames = conceptNames[lang].names;
  const entries = [
    ...games.map((game) => {
      const name = copy.games[game.slug].name;
      return {
        slug: game.slug,
        name,
        isConcept: false,
        artwork: game.posters.map((_, j) => storePoster(game, j, name)),
      };
    }),
    ...concepts.map((slug, index) => ({
      slug,
      name: originalNames[index],
      isConcept: true,
      artwork: [
        {
          src: "/art/covers/" + slug + ".webp",
          caption: originalNames[index],
          width: 418,
          height: 627,
        },
      ],
    })),
  ];
  return (
    <>
      <PageBanner title={story.work} intro={story.catalog} compact />
      <div className="shell catalog-page work-grid all-works">
        {entries.map(({ slug, name, isConcept, artwork }, i) => (
          <article key={slug} id={slug} className="portfolio-card">
            <ImageGallery
              items={artwork}
              title={name}
              controls={copy.explore.preview}
              className="portfolio-media"
              captions={false}
              coverOnly
              priority={i === 0}
            />
            <h2
              className="portfolio-name"
              id={i === games.length ? "concept-heading" : undefined}
            >
              {name}
            </h2>
            {isConcept && (
              <span className="concept-status">{story.conceptTag}</span>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
