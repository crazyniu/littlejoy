import { address } from "../lib/languages";
import { contact, storePoster } from "../lib/catalog";
import { games, concepts } from "../lib/portfolio.mjs";
import conceptNames from "../lib/concept-names.json";
import ImageGallery from "./ImageGallery";
import PageBanner from "./PageBanner";

function PageLink({ href, children }) {
  return (
    <a className="pixel-link" href={href}>
      {children}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function PocketScreen() {
  return (
    <div className="pocket-scene" aria-hidden="true">
      <div className="pixel-sky">
        <i />
        <i />
        <i />
      </div>
      <div className="pocket">
        <div className="pocket-bezel">
          <img
            src="/art/site/island.webp"
            alt=""
            width="1080"
            height="720"
            fetchPriority="high"
          />
        </div>
        <div className="pocket-controls">
          <i className="pocket-pad" />
          <i className="pocket-speaker" />
          <span className="pocket-keys">
            <i />
            <i />
          </span>
        </div>
      </div>
    </div>
  );
}

export function StudioHome({ lang, copy, labels, story }) {
  const controls = copy.explore.preview;
  const featureArt = games.map((game) =>
    storePoster(game, 0, copy.games[game.slug].name),
  );
  const ideaArt = [1, 3, 5].map((i) => ({
    src: "/art/covers/" + concepts[i] + ".webp",
    caption: conceptNames[lang].names[i],
    width: 418,
    height: 627,
  }));
  return (
    <>
      <section className="studio-band studio-landing">
        <div className="shell landing-layout">
          <div className="home-heading">
            <p className="studio-kind">{copy.ui.indie}</p>
            <h1>
              Littlejoy{" "}
              <span>
                Games<b>.</b>
              </span>
            </h1>
          </div>
          <PocketScreen />
          <div className="landing-copy">
            <p className="lead-copy">{story.lead}</p>
            <div className="landing-actions">
              <PageLink href={address(lang, "games")}>{story.work}</PageLink>
              <a className="plain-link" href={address(lang, "about")}>
                {labels.about}
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="shell editorial-spread edition">
        <h2 className="edition-title">{story.spotTitle}</h2>
        <ImageGallery
          className="paired-prints"
          items={featureArt}
          controls={controls}
          title={story.spotTitle}
        />
        <div className="spread-text edition-note">
          <p>{story.spotText}</p>
          <PageLink href={address(lang, "games")}>{copy.ui.works}</PageLink>
        </div>
      </section>
      <section className="concept-desk">
        <div className="shell">
          <div className="desk-copy">
            <h2>{story.ideaTitle}</h2>
            <p>{story.ideaText}</p>
          </div>
          <ImageGallery
            className="desk-prints"
            items={ideaArt}
            controls={controls}
            title={conceptNames[lang].heading}
          />
          <a className="plain-link" href={address(lang, "games")}>
            {conceptNames[lang].heading} ↗
          </a>
        </div>
      </section>
    </>
  );
}

export function About({ lang, labels, copy, story }) {
  const studioImage = {
    src: "/art/site/workroom.webp",
    caption: copy.ui.workshopArt,
    width: 1152,
    height: 768,
  };
  return (
    <>
      <PageBanner
        title={labels.about}
        intro={labels.team}
        artwork={
          <ImageGallery
            className="workroom-print"
            items={[studioImage]}
            priority
            title={copy.ui.art}
            controls={copy.explore.preview}
          />
        }
      >
        <dl className="location-line">
          <dt>{labels.hq}</dt>
          <dd>{labels.location}</dd>
        </dl>
      </PageBanner>
      <section className="shell editorial-spread team-notes">
        <div className="spread-text">
          <h2>{story.teamTitle}</h2>
          <p>{story.teamText}</p>
        </div>
        <div className="spread-text">
          <h2>{story.artTitle}</h2>
          <p>{story.artText}</p>
          <PageLink href={address(lang, "games")}>{story.work}</PageLink>
        </div>
      </section>
      <section className="studio-process">
        <div className="shell studio-process-layout">
          <ImageGallery
            className="workroom-print"
            items={[
              {
                src: "/art/site/sketch-desk.webp",
                caption: story.deskCaption,
                width: 1199,
                height: 656,
              },
            ]}
            controls={copy.explore.preview}
            title={story.drawTitle}
          />
          <div className="spread-text">
            <h2>{story.drawTitle}</h2>
            <p>{story.drawText}</p>
            <p>{story.drawMore}</p>
          </div>
        </div>
      </section>
    </>
  );
}

export function ContactPage({ lang, labels, story, copy, support }) {
  const faq = copy.explore.faq;
  const topics = support
    ? [
        [faq[0].question, faq[0].answer],
        [copy.ui.privacy, story.privacyHelp],
      ]
    : [
        [story.partnerTitle, story.partnerText],
        [story.rightsTitle, story.rightsText],
      ];
  return (
    <>
      <PageBanner
        title={support ? labels.support : labels.contact}
        intro={support ? labels.supportIntro : labels.contactIntro}
        compact={support}
        artwork={
          !support && (
            <ImageGallery
              className="workroom-print"
              items={[
                {
                  src: "/art/site/post-desk.webp",
                  caption: story.mailCaption,
                  width: 1199,
                  height: 656,
                },
              ]}
              title={story.mailTitle}
              controls={copy.explore.preview}
              priority
            />
          )
        }
      >
        <a className="pixel-link band-action" href={"mailto:" + contact}>
          {contact}
          <span aria-hidden="true">↗</span>
        </a>
      </PageBanner>
      {!support && (
        <section className="shell correspondence">
          <div className="spread-text">
            <h2>{story.mailTitle}</h2>
          </div>
          <div className="spread-text">
            <p>{story.mailText}</p>
            <p>{story.mailMore}</p>
          </div>
        </section>
      )}
      <section className="shell inbox-topics">
        {topics.map(([title, text]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
        <a
          className="plain-link"
          href={address(lang, support ? "privacy" : "support")}
        >
          {support ? copy.ui.privacy : labels.support} ↗
        </a>
      </section>
    </>
  );
}
