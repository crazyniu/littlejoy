import { address } from "../lib/languages";
import { contact } from "../lib/catalog";
import { artSlots, concepts, games, totals } from "../lib/portfolio.mjs";
import conceptNames from "../lib/concept-names.json";
import ArtSlot from "./ArtSlot";
import GameFeature from "./GameFeature";
import ImageGallery from "./ImageGallery";
import Img from "./Img";
import PageBanner from "./PageBanner";
import PixelCity from "./PixelCity";
import Starfield from "./Starfield";
import { Kicker, PixelArrow, PixelSprite, SplitText, longestWord } from "./Pixel";

const segmenters = new Map();
function words(text, lang) {
  if (!segmenters.has(lang))
    segmenters.set(lang, new Intl.Segmenter(lang, { granularity: "word" }));
  return [...segmenters.get(lang).segment(text)].map((s) => s.segment);
}

export function Button({ href, children, variant = "primary", arrow = true }) {
  return (
    <a className={"btn btn-" + variant} href={href}>
      <span className="btn-label">{children}</span>
      {arrow && <PixelArrow />}
    </a>
  );
}

export function SectionHead({ kicker, index, title, text, lang, align }) {
  return (
    <div className={"section-head" + (align ? " section-head--" + align : "")}>
      {kicker && <Kicker index={index}>{kicker}</Kicker>}
      <h2 className="display" style={{ "--long": longestWord(title, lang) }}>
        <SplitText text={title} lang={lang} />
      </h2>
      {text && (
        <p className="section-text" data-reveal>
          {text}
        </p>
      )}
    </div>
  );
}

function Hero({ lang, copy, labels, story, show, arcade }) {
  return (
    <section className="hero">
      <Starfield critters />
      <div className="hero-sun" aria-hidden="true" />
      <div className="hero-floor" aria-hidden="true" />
      <div className="hero-clouds" aria-hidden="true">
        <PixelSprite name="cloud" size={6} />
        <PixelSprite name="cloud" size={4} />
        <PixelSprite name="cloud" size={5} />
      </div>
      <div className="shell hero-layout">
        <div className="hero-copy">
          <p className="hero-badge">
            <span className="live-dot" aria-hidden="true" />
            {copy.ui.indie} · {labels.location}
          </p>
          <h1 className="hero-title display">
            <span className="hero-line">
              <SplitText text={show.heroA} lang={lang} />
            </span>
            <span className="hero-line hero-line--accent">
              <SplitText text={show.heroB} lang={lang} start={[...show.heroA].length} />
            </span>
          </h1>
          <p className="hero-lead">{story.lead}</p>
          <div className="hero-actions">
            <Button href={address(lang, "games")}>{story.work}</Button>
            <Button href={address(lang, "play")} variant="ghost" arrow={false}>
              <PixelSprite name="pad" size={2} /> {arcade.play}
            </Button>
          </div>
        </div>
        <div className="hero-stage">
          <a className="console" href={address(lang, "play")} aria-label={arcade.playTitle + " · " + arcade.playKicker}>
            <span className="console-screen">
              <Img
                src="/art/site/island.webp"
                alt=""
                sizes="(max-width: 959px) 86vw, 540px"
                priority
              />
              <span className="console-press" aria-hidden="true">PRESS START</span>
            </span>
            <span className="console-controls" aria-hidden="true">
              <i className="console-pad" />
              <span className="console-brand">LITTLEJOY</span>
              <span className="console-keys">
                <i />
                <i />
              </span>
            </span>
          </a>
          <img className="hero-mascot hero-mascot--fish" src="/art/clownfish.webp" alt="" width="192" height="170" />
          <img className="hero-mascot hero-mascot--bird" src="/art/sunbird.webp" alt="" width="310" height="315" />
          <img className="hero-mascot hero-mascot--puffer" src="/art/little-fish.webp" alt="" width="192" height="158" />
          <PixelSprite name="heart" size={5} className="hero-pop hero-pop--1" />
          <PixelSprite name="coin" size={4} className="hero-pop hero-pop--2" />
          <PixelSprite name="star" size={4} className="hero-pop hero-pop--3" />
        </div>
      </div>
      <a className="hero-scroll" href="#studio" aria-hidden="true" tabIndex={-1}>
        <span>SCROLL</span>
        <PixelSprite name="up" size={3} />
      </a>
    </section>
  );
}

function Ticker({ lang, copy }) {
  const items = [
    ...games.map((g) => copy.games[g.slug].name),
    ...conceptNames[lang].names,
  ];
  const strip = (hidden) => (
    <div className="ticker-strip" aria-hidden={hidden || undefined}>
      {items.map((name, i) => (
        <span key={i}>
          {name}
          <PixelSprite name={i % 3 ? "sparkle" : "heart"} size={3} />
        </span>
      ))}
    </div>
  );
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-band ticker-band--a">
        <div className="ticker-track">
          {strip()}
          {strip(true)}
        </div>
      </div>
      <div className="ticker-band ticker-band--b">
        <div className="ticker-track ticker-track--reverse">
          {strip(true)}
          {strip(true)}
        </div>
      </div>
    </div>
  );
}

export function StatsStrip({ copy, show }) {
  const labels = copy.explore.labels;
  const stats = [
    [totals.levels, labels.levels, "coin"],
    [totals.worlds, show.statWorlds, "globe"],
    [totals.creatures, labels.creatures, "fish"],
    [totals.concepts, show.statConcepts, "bulb"],
    [14, show.languages, "heart"],
  ];
  return (
    <section className="stats">
      <dl className="shell stats-grid" data-stagger>
        {stats.map(([value, label, sprite]) => (
          <div className="stat" key={sprite} data-reveal>
            <PixelSprite name={sprite} size={4} />
            <dd data-count={value}>{value}</dd>
            <dt>{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Manifesto({ text, lang, kicker }) {
  return (
    <div className="manifesto">
      <Kicker index="✦">{kicker}</Kicker>
      <p className="manifesto-text" data-words>
        {words(text, lang).map((w, i) =>
          /^\s+$/.test(w) ? (
            " "
          ) : (
            <span className="mw" key={i}>
              {w}
            </span>
          ),
        )}
      </p>
    </div>
  );
}

export function Pillars({ show, lang }) {
  const icons = ["star", "bulb", "phone"];
  return (
    <div className="pillars">
      <h2 className="pillars-title display" style={{ "--long": longestWord(show.pillarsTitle, lang) }}>
        <SplitText text={show.pillarsTitle} lang={lang} />
      </h2>
      <ul className="pillar-grid" data-stagger>
        {show.pillars.map(([title, text], i) => (
          <li className="pillar" key={title} data-reveal data-tilt>
            <span className="pillar-no">0{i + 1}</span>
            <PixelSprite name={icons[i]} size={5} />
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConceptMarquee({ lang, story }) {
  const names = conceptNames[lang].names;
  const cards = concepts.map((slug, i) => ({ slug, name: names[i] }));
  const rows = [cards.slice(0, 9), cards.slice(9)];
  return (
    <section className="concepts">
      <div className="shell">
        <SectionHead
          kicker={conceptNames[lang].heading}
          index="02"
          title={story.ideaTitle}
          text={story.ideaText}
          lang={lang}
        />
      </div>
      <div className="concept-rows">
        {rows.map((row, r) => (
          <div className="concept-row" key={r}>
            <div className={"concept-track" + (r ? " concept-track--reverse" : "")}>
              {[0, 1].map((copyIndex) =>
                row.map(({ slug, name }) => (
                  <a
                    key={copyIndex + slug}
                    className="concept-card"
                    href={address(lang, "games") + "#" + slug}
                    aria-hidden={copyIndex ? "true" : undefined}
                    tabIndex={copyIndex ? -1 : undefined}
                  >
                    <Img src={"/art/covers/" + slug + ".webp"} sizes="220px" />
                    <span className="concept-name">{name}</span>
                    <span className="concept-tag">{story.conceptTag}</span>
                  </a>
                )),
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="shell section-foot">
        <Button href={address(lang, "games")} variant="ghost">
          {conceptNames[lang].heading}
        </Button>
      </div>
    </section>
  );
}

function StudioTeaser({ lang, labels, story, show, copy }) {
  const steps = [
    [story.teamTitle, "bulb"],
    [story.artTitle, "pencil"],
    [story.drawTitle, "phone"],
  ];
  return (
    <section className="teaser">
      <div className="shell teaser-layout">
        <div className="teaser-art" data-reveal="wipe">
          <div className="crt" data-parallax="0.06">
            <Img
              src="/art/site/workroom.webp"
              alt={copy.ui.workshopArt}
              sizes="(max-width: 959px) 92vw, 600px"
              pixelate
            />
          </div>
          <PixelSprite name="pad" size={6} className="teaser-pad" />
        </div>
        <div className="teaser-copy">
          <SectionHead
            kicker={labels.about}
            index="03"
            title={show.processTitle}
            text={labels.team}
            lang={lang}
          />
          <ol className="step-list" data-stagger>
            {steps.map(([title, sprite], i) => (
              <li key={title} data-reveal>
                <PixelSprite name={sprite} size={4} />
                <span className="step-no">0{i + 1}</span>
                {title}
              </li>
            ))}
          </ol>
          <Button href={address(lang, "about")}>{copy.ui.about}</Button>
        </div>
      </div>
    </section>
  );
}

export function CallToAction({ lang, labels, story, show, support = true }) {
  return (
    <section className="cta">
      <div className="shell">
        <div className="cta-panel" data-reveal>
          <Starfield density={0.5} />
          <div className="cta-flight" aria-hidden="true">
            <PixelSprite name="mail" size={6} />
          </div>
          <Kicker index="✉">{labels.contact}</Kicker>
          <h2 className="display" style={{ "--long": longestWord(story.mailTitle, lang) }}>
            <SplitText text={story.mailTitle} lang={lang} />
          </h2>
          <p className="cta-text">{labels.contactIntro}</p>
          <div className="cta-actions">
            <Button href={"mailto:" + contact}>{show.mailCta}</Button>
            {support && (
              <Button href={address(lang, "support")} variant="ghost" arrow={false}>
                {labels.support}
              </Button>
            )}
          </div>
          <p className="cta-mail">{contact}</p>
        </div>
      </div>
    </section>
  );
}

function PlayTeaser({ lang, arcade }) {
  const perches = [
    [0, 0, 2],
    [1, 2],
    [1, 1, 0],
  ];
  return (
    <section className="play-teaser">
      <div className="shell">
        <div className="play-panel" data-reveal>
          <div className="play-copy">
            <Kicker index="▶">{arcade.playKicker}</Kicker>
            <h2 className="display" style={{ "--long": longestWord(arcade.teaserTitle, lang) }}>
              <SplitText text={arcade.teaserTitle} lang={lang} />
            </h2>
            <p>{arcade.teaserText}</p>
            <Button href={address(lang, "play")}>{arcade.teaserCta}</Button>
          </div>
          <a className="play-preview" href={address(lang, "play")} tabIndex={-1} aria-hidden="true">
            {perches.map((birds, i) => (
              <span className={"pp-branch " + (i % 2 ? "is-right" : "is-left")} key={i} style={{ "--i": i }}>
                {birds.map((c, j) => (
                  <span className={"pp-bird pp-c" + c} key={j} style={{ "--j": j }}>
                    <PixelSprite name="perch" size={4} />
                  </span>
                ))}
              </span>
            ))}
            <span className="pp-title">{arcade.playTitle}</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export function StudioHome({ lang, copy, labels, story, show, arcade }) {
  return (
    <>
      <Hero lang={lang} copy={copy} labels={labels} story={story} show={show} arcade={arcade} />
      <Ticker lang={lang} copy={copy} />
      <section className="studio-intro" id="studio">
        <div className="shell">
          <Manifesto text={copy.ui.aboutBody} lang={lang} kicker={copy.ui.about} />
        </div>
      </section>
      <StatsStrip copy={copy} show={show} />
      <section className="games-showcase">
        <div className="shell">
          <SectionHead
            kicker={copy.ui.works}
            index="01"
            title={story.spotTitle}
            text={story.spotText}
            lang={lang}
          />
        </div>
        {games.map((game, i) => (
          <GameFeature key={game.slug} game={game} index={i} lang={lang} copy={copy} />
        ))}
      </section>
      <PlayTeaser lang={lang} arcade={arcade} />
      <ConceptMarquee lang={lang} story={story} />
      <StudioTeaser lang={lang} labels={labels} story={story} show={show} copy={copy} />
      <CallToAction lang={lang} labels={labels} story={story} show={show} />
    </>
  );
}

export function About({ lang, labels, copy, story, show }) {
  const names = conceptNames[lang].names;
  const steps = [
    {
      title: story.teamTitle,
      text: [story.teamText],
      sprite: "bulb",
      covers: ["rainy-teahouse", "otter-post", "moonlit-kiln"].map((slug) => [
        "/art/covers/" + slug + ".webp",
        names[concepts.indexOf(slug)],
      ]),
    },
    {
      title: story.artTitle,
      text: [story.artText],
      sprite: "pencil",
      covers: games.map((g) => ["/art/covers/" + g.slug + ".webp", copy.games[g.slug].name]),
    },
    {
      title: story.drawTitle,
      text: [story.drawText, story.drawMore],
      sprite: "phone",
      image: { src: "/art/site/sketch-desk.webp", caption: story.deskCaption },
    },
  ];
  return (
    <>
      <PageBanner lang={lang} kicker={copy.ui.indie} title={labels.about} intro={labels.team} sprite="logo">
        <p className="banner-chip">
          <PixelSprite name="pin" size={3} />
          {labels.hq} · {labels.location}
        </p>
      </PageBanner>
      <section className="about-story">
        <div className="shell about-story-layout">
          <ArtSlot {...artSlots.team} alt={labels.team} className="about-portrait">
            <div className="art-frame about-portrait" data-reveal="wipe">
              <Img
                src="/art/site/workroom.webp"
                alt={copy.ui.workshopArt}
                sizes="(max-width: 959px) 92vw, 640px"
                pixelate
              />
            </div>
          </ArtSlot>
          <div className="about-story-copy">
            <Kicker index="01">{copy.ui.about}</Kicker>
            <p className="about-lead" data-reveal>
              {story.lead}
            </p>
            <dl className="fact-list" data-stagger>
              <div data-reveal>
                <dt>{labels.hq}</dt>
                <dd>{labels.location}</dd>
              </div>
              <div data-reveal>
                <dt>{copy.ui.works}</dt>
                <dd>
                  {games.map((g, i) => (
                    <span key={g.slug}>
                      {i > 0 && " · "}
                      <a href={address(lang, "games/" + g.slug)}>{copy.games[g.slug].name}</a>
                    </span>
                  ))}
                </dd>
              </div>
              <div data-reveal>
                <dt>{conceptNames[lang].heading}</dt>
                <dd>{concepts.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
      <section className="studio-intro">
        <div className="shell">
          <Pillars show={show} lang={lang} />
        </div>
      </section>
      <section className="process">
        <div className="shell">
          <SectionHead kicker={story.drawTitle} index="02" title={show.processTitle} lang={lang} />
          <ol className="timeline" data-fill>
            {steps.map((step, i) => (
              <li className="timeline-step" key={step.title}>
                <span className="timeline-node" aria-hidden="true">
                  <PixelSprite name={step.sprite} size={4} />
                </span>
                <div className="timeline-copy" data-reveal>
                  <span className="step-no">STEP 0{i + 1}</span>
                  <h3>{step.title}</h3>
                  {step.text.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
                <div className="timeline-art" data-reveal="wipe">
                  {step.image ? (
                    <ImageGallery
                      className="framed-print"
                      items={[step.image]}
                      controls={copy.explore.preview}
                      captions={false}
                      sizes="(max-width: 959px) 92vw, 560px"
                    />
                  ) : (
                    <div className={"cover-stack cover-stack--" + step.covers.length}>
                      {step.covers.map(([src, alt], j) => (
                        <Img key={src} src={src} alt={alt} sizes="220px" style={{ "--n": j }} pixelate />
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="city">
        <div className="shell city-layout">
          <ArtSlot {...artSlots.city} alt={labels.location}>
            <PixelCity label={labels.location} />
          </ArtSlot>
          <div className="city-card" data-reveal>
            <PixelSprite name="pin" size={5} />
            <p className="city-label">{labels.hq}</p>
            <p className="city-name display">{labels.location}</p>
            <p className="city-note">{show.crafted}</p>
          </div>
        </div>
      </section>
      <CallToAction lang={lang} labels={labels} story={story} show={show} />
    </>
  );
}

export function ContactPage({ lang, labels, story, copy, show, support }) {
  if (support) return <SupportPage lang={lang} labels={labels} story={story} copy={copy} show={show} />;
  const topics = [
    [story.partnerTitle, story.partnerText, "pad", "mailto:" + contact, show.mailCta],
    [story.rightsTitle, story.rightsText, "pencil", "mailto:" + contact, show.mailCta],
    [labels.support, labels.supportIntro, "heart", address(lang, "support"), labels.support],
  ];
  return (
    <>
      <PageBanner
        lang={lang}
        kicker={copy.ui.termsContact}
        title={labels.contact}
        intro={labels.contactIntro}
        sprite="mail"
        artwork={
          <ImageGallery
            className="framed-print"
            items={[{ src: "/art/site/post-desk.webp", caption: story.mailCaption }]}
            controls={copy.explore.preview}
            captions={false}
            sizes="(max-width: 959px) 92vw, 560px"
            priority
          />
        }
      >
        <Button href={"mailto:" + contact}>{contact}</Button>
      </PageBanner>
      <section className="letter">
        <div className="shell letter-layout">
          <div className="letter-head">
            <Kicker index="01">{labels.contact}</Kicker>
            <h2 className="display" style={{ "--long": longestWord(story.mailTitle, lang) }}>
              <SplitText text={story.mailTitle} lang={lang} />
            </h2>
          </div>
          <div className="letter-copy" data-stagger>
            <p data-reveal>{story.mailText}</p>
            <p data-reveal>{story.mailMore}</p>
          </div>
        </div>
      </section>
      <section className="topics">
        <ul className="shell topic-grid" data-stagger>
          {topics.map(([title, text, sprite, href, action]) => (
            <li className="topic" key={title} data-reveal data-tilt>
              <PixelSprite name={sprite} size={5} />
              <h2>{title}</h2>
              <p>{text}</p>
              <a className="topic-link" href={href}>
                {action}
                <PixelArrow />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function SupportPage({ lang, labels, story, copy, show }) {
  return (
    <>
      <PageBanner
        lang={lang}
        kicker={copy.ui.policies}
        title={labels.support}
        intro={labels.supportIntro}
        sprite="heart"
        compact
      >
        <Button href={"mailto:" + contact}>{contact}</Button>
      </PageBanner>
      <section className="faq">
        <div className="shell faq-layout">
          <SectionHead kicker="FAQ" index="01" title={show.faqTitle} lang={lang} />
          <div className="faq-list" data-stagger>
            {copy.explore.faq.map(({ question, answer }, i) => (
              <details className="faq-item" key={question} data-reveal open={i === 0}>
                <summary>
                  <span className="faq-no">Q{i + 1}</span>
                  {question}
                  <span className="faq-icon" aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="howto">
        <div className="shell">
          <SectionHead kicker={copy.ui.how} index="02" title={copy.explore.labels.guide} lang={lang} />
          <div className="howto-grid">
            {games.map((game) => {
              const info = copy.games[game.slug];
              return (
                <article className={"howto-card game--" + game.color} key={game.slug} data-reveal data-tilt>
                  <header>
                    <Img src={"/art/covers/" + game.slug + ".webp"} sizes="120px" />
                    <div>
                      <p className="howto-genre">{info.genre}</p>
                      <h3>
                        <a href={address(lang, "games/" + game.slug)}>{info.name}</a>
                      </h3>
                    </div>
                  </header>
                  <ol>
                    {info.guide.map(({ title, text }) => (
                      <li key={title}>
                        <strong>{title}</strong>
                        <p>{text}</p>
                      </li>
                    ))}
                  </ol>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="topics">
        <ul className="shell topic-grid topic-grid--two" data-stagger>
          <li className="topic" data-reveal data-tilt>
            <PixelSprite name="lock" size={5} />
            <h2>{copy.ui.privacy}</h2>
            <p>{story.privacyHelp}</p>
            <a className="topic-link" href={address(lang, "privacy")}>
              {copy.ui.privacy}
              <PixelArrow />
            </a>
          </li>
          <li className="topic" data-reveal data-tilt>
            <PixelSprite name="star" size={5} />
            <h2>{copy.ui.terms}</h2>
            <p>{show.termsGlance[0]} {show.termsGlance[2]}</p>
            <a className="topic-link" href={address(lang, "terms")}>
              {copy.ui.terms}
              <PixelArrow />
            </a>
          </li>
        </ul>
      </section>
      <CallToAction lang={lang} labels={labels} story={story} show={show} support={false} />
    </>
  );
}
