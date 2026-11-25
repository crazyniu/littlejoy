import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { contact, dictionary, legalDocument } from "../../lib/catalog";
import { address, languages, readPath } from "../../lib/languages";
import { games } from "../../lib/portfolio.mjs";
import { routes } from "../../lib/routes.mjs";
import editorial from "../../lib/editorial.json";
import arcadeCopy from "../../lib/arcade.json";
import { StudioHome, About, ContactPage } from "../StudioPages";
import siteCopy from "../../lib/site-copy.json";
import showcase from "../../lib/showcase.json";
import { LostPage, PlayPage } from "../Arcade";
import GamePage from "../GamePage";
import { Lightbox } from "../ImageGallery";
import PageBanner from "../PageBanner";
import LanguagePicker from "../LanguagePicker";
import Portfolio from "../Portfolio";
import SiteHeader from "../SiteHeader";
import { PixelSprite } from "../Pixel";

const SITE = "https://shopkivoo.com";
// "lost" renders the 404 page; scripts/postbuild.mjs moves it to /404.html.
const LOST = "lost";
const known = (section) => routes.includes(section) || section === LOST;
const gameOf = (section) => games.find((g) => section === "games/" + g.slug);

// Cache-busting query for scripts in public/.
const version = (file) =>
  createHash("sha256")
    .update(readFileSync(join(process.cwd(), "public", file)))
    .digest("hex")
    .slice(0, 10);

export const dynamicParams = false;
export function generateStaticParams() {
  return [
    ...Object.keys(languages).flatMap((lang) =>
      routes.map((section) => ({
        path: [lang, ...section.split("/").filter(Boolean)],
      })),
    ),
    { path: [LOST] },
  ];
}

export async function generateMetadata({ params }) {
  const { lang, section } = readPath((await params).path);
  if (!known(section)) notFound();
  const { ui, games: gameCopy, explore } = await dictionary(lang);
  const labels = siteCopy[lang];
  const story = editorial[lang];
  const arcade = arcadeCopy[lang];
  const game = gameOf(section);
  const policy = section === "privacy" || section === "terms";
  let title;
  let description;
  if (!section) {
    title = "Littlejoy Games — " + ui.indie;
    description = story.lead;
  } else if (section === LOST) {
    title = arcade.lostTitle;
    description = arcade.lostText;
  } else if (game) {
    const info = gameCopy[game.slug];
    title = info.name + " — " + info.genre;
    description = info.note + " " + explore.features[game.slug].world;
  } else if (section === "play") {
    title = arcade.playTitle + " — " + arcade.playKicker;
    description = arcade.playIntro;
  } else if (section === "games") {
    title = story.work;
    description = story.catalog;
  } else if (policy) {
    title = ui[section];
    description = (await legalDocument(lang, section)).intro;
  } else {
    title = labels[section] || ui[section];
    description =
      section === "about" ? [labels.team, labels.location].join(" ") : labels[section + "Intro"];
  }
  if (section) title += " | Littlejoy Games";
  if (section === LOST) return { title, description, robots: { index: false } };
  const alternates = Object.fromEntries(
    Object.entries(languages).map(([key, locale]) => [locale.tag, address(key, section)]),
  );
  const image = { url: "/og.jpg", width: 1200, height: 630, alt: "Littlejoy Games" };
  return {
    title,
    description,
    alternates: {
      canonical: address(lang, section),
      languages: { ...alternates, "x-default": section ? "/" + section + "/" : "/" },
    },
    openGraph: {
      title,
      description,
      url: address(lang, section),
      siteName: "Littlejoy Games",
      locale: languages[lang].tag.replace("-", "_"),
      type: "website",
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

// schema.org data: the studio on the home page, the game on game pages.
function structuredData({ lang, section, copy }) {
  const org = {
    "@type": "Organization",
    "@id": SITE + "/#studio",
    name: "Littlejoy Games",
    url: SITE + "/",
    logo: SITE + "/icon.png",
    email: contact,
    address: { "@type": "PostalAddress", addressLocality: "Los Angeles", addressRegion: "CA", addressCountry: "US" },
  };
  const game = gameOf(section);
  if (!section) {
    return {
      "@context": "https://schema.org",
      "@graph": [
        org,
        { "@type": "WebSite", name: "Littlejoy Games", url: SITE + "/", inLanguage: languages[lang].tag },
      ],
    };
  }
  if (game) {
    const info = copy.games[game.slug];
    return {
      "@context": "https://schema.org",
      "@type": "VideoGame",
      name: info.name,
      genre: info.genre,
      description: info.note,
      image: SITE + "/art/covers/" + game.slug + ".webp",
      url: SITE + address(lang, section),
      inLanguage: languages[lang].tag,
      gamePlatform: ["iOS", "Android"],
      publisher: { "@id": SITE + "/#studio", ...org },
    };
  }
  return null;
}

function Header({ lang, section, t, labels, show, arcade }) {
  const links = [
    ["", labels.home],
    ["about", labels.about],
    ["games", editorial[lang].work],
    ["play", arcade.play],
    ["contact", labels.contact],
  ].map(([target, label]) => ({
    href: address(lang, target),
    label,
    current: section === target || (target === "games" && Boolean(gameOf(section))),
  }));
  return (
    <SiteHeader
      home={address(lang)}
      links={links}
      navLabel={t.navigation}
      menuLabel={show.menu}
      closeLabel={show.close}
      email={contact}
    >
      <LanguagePicker lang={lang} section={section === LOST ? "" : section} label={t.language} />
    </SiteHeader>
  );
}

function Footer({ lang, t, labels, show, arcade, copy }) {
  const story = editorial[lang];
  const columns = [
    [
      "Littlejoy Games",
      [
        [address(lang), labels.home],
        [address(lang, "about"), labels.about],
        [address(lang, "contact"), labels.contact],
      ],
    ],
    [
      story.work,
      [
        [address(lang, "games"), t.works],
        ...games.map((g) => [address(lang, "games/" + g.slug), copy.games[g.slug].name]),
        [address(lang, "play"), arcade.playTitle],
      ],
    ],
    [
      t.policies,
      [
        [address(lang, "support"), labels.support],
        [address(lang, "privacy"), t.privacy],
        [address(lang, "terms"), t.terms],
      ],
    ],
  ];
  return (
    <footer className="site-footer">
      <div className="footer-marquee" aria-hidden="true">
        <div className="footer-marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>
              LITTLEJOY <PixelSprite name="heart" size={6} /> GAMES{" "}
              <PixelSprite name="star" size={6} /> PRESS START{" "}
              <PixelSprite name="coin" size={6} />{" "}
            </span>
          ))}
        </div>
      </div>
      <div className="shell footer-grid">
        <div className="footer-brand">
          <a className="brand" href={address(lang)} aria-label="Littlejoy Games">
            <PixelSprite name="logo" size={4} />
            <span className="wordmark">
              littlejoy<span className="wordmark-games">games</span>
            </span>
          </a>
          <p>{t.heroLead}</p>
          <a className="footer-mail" href={"mailto:" + contact}>
            <PixelSprite name="mail" size={3} />
            {contact}
          </a>
        </div>
        {columns.map(([heading, items]) => (
          <nav className="footer-col" key={heading} aria-label={heading}>
            <h2>{heading}</h2>
            <ul>
              {items.map(([href, label]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="footer-col">
          <h2>{labels.hq}</h2>
          <p className="footer-place">
            <PixelSprite name="pin" size={3} />
            {labels.location}
          </p>
          <p className="footer-crafted">{show.crafted}</p>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 Littlejoy Games</span>
        <span className="footer-ver" aria-hidden="true">
          v3.0 · <span className="blink">▮</span>
        </span>
      </div>
      <a className="to-top" href="#top" aria-label={show.top}>
        <PixelSprite name="up" size={3} />
      </a>
    </footer>
  );
}

async function DocumentPage({ lang, section, t, labels, show }) {
  const policyUpdated = section === "privacy" ? "2026-11-25" : "2026-11-19";
  const date = new Intl.DateTimeFormat(languages[lang].tag, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(policyUpdated));
  const doc = await legalDocument(lang, section);
  const other = section === "privacy" ? "terms" : "privacy";
  const glance = section === "privacy" ? show.privacyGlance : show.termsGlance;
  const glanceIcons =
    section === "privacy"
      ? ["phone", "coin", "globe", "mail"]
      : ["pad", "heart", "pencil", "bulb"];
  const contents = (
    <ol>
      {doc.sections.map(([id, title], i) => (
        <li key={id}>
          <a href={"#" + id}>
            <span className="toc-no">{String(i + 1).padStart(2, "0")}</span>
            {title}
          </a>
        </li>
      ))}
    </ol>
  );
  return (
    <div className="document">
      <PageBanner
        lang={lang}
        kicker={t.policies}
        title={t[section]}
        intro={doc.intro}
        sprite={section === "privacy" ? "lock" : "star"}
        compact
      >
        <p className="banner-chip">
          {labels.updated} <time dateTime={policyUpdated}>{date}</time>
        </p>
      </PageBanner>
      <section className="glance">
        <div className="shell">
          <h2 className="glance-title">{show.glanceTitle}</h2>
          <ul className="glance-grid" data-stagger>
            {glance.map((item, i) => (
              <li key={item} data-reveal>
                <PixelSprite name={glanceIcons[i]} size={4} />
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <div className="shell doc-grid">
        <aside className="doc-aside">
          <nav className="toc" aria-label={t.policyNav} data-spy>
            <h2>{t.policyNav}</h2>
            {contents}
          </nav>
          <details className="toc-mobile">
            <summary>{t.policyNav}</summary>
            <nav aria-label={t.policyNav}>{contents}</nav>
          </details>
        </aside>
        <article className="doc-copy">
          {doc.sections.map(([id, title, paragraphs], i) => (
            <section id={id} key={id}>
              <h2>
                <span className="doc-no">{String(i + 1).padStart(2, "0")}</span>
                {title}
              </h2>
              {paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
          <div className="contact-box" id="policy-contact">
            <PixelSprite name="mail" size={4} />
            <strong>
              {section === "privacy" ? t.privacyContact : t.termsContact}
            </strong>
            <a href={"mailto:" + contact}>{contact} ↗</a>
          </div>
          {section === "privacy" && (
            <div className="provider-links">
              {[
                ["Cloudflare", "https://www.cloudflare.com/privacypolicy/"],
                ["Apple", "https://www.apple.com/legal/privacy/"],
                ["Google", "https://policies.google.com/privacy"],
                ["Google AdMob", "https://policies.google.com/technologies/partner-sites"],
                ["Firebase", "https://firebase.google.com/support/privacy"],
              ].map(([name, url]) => (
                <a key={name} href={url}>
                  {name} · {t.privacy} ↗
                </a>
              ))}
            </div>
          )}
          <a className="related-doc" href={address(lang, other)}>
            <span>{t[other]}</span>
            <PixelSprite name="arrow" size={4} />
          </a>
        </article>
      </div>
    </div>
  );
}

export default async function Page({ params }) {
  const { lang, section } = readPath((await params).path);
  if (!known(section)) notFound();
  const copy = await dictionary(lang);
  const t = copy.ui;
  const labels = siteCopy[lang];
  const story = editorial[lang];
  const show = showcase[lang];
  const arcade = arcadeCopy[lang];
  const props = { lang, copy, labels, story, show, arcade };
  const game = gameOf(section);
  let content;
  if (!section) content = <StudioHome {...props} />;
  else if (section === LOST) content = <LostPage arcade={arcade} copy={copy} />;
  else if (game) content = <GamePage slug={game.slug} {...props} />;
  else if (section === "games") content = <Portfolio {...props} />;
  else if (section === "play") content = <PlayPage {...props} />;
  else if (section === "about") content = <About {...props} />;
  else if (section === "contact" || section === "support")
    content = <ContactPage {...props} support={section === "support"} />;
  else content = <DocumentPage lang={lang} section={section} t={t} labels={labels} show={show} />;

  const data = structuredData({ lang, section, copy });
  const page = section === LOST ? "lost" : game ? "game" : (section || "home").replace("/", "-");
  return (
    <>
      <div id="top" />
      <a className="skip" href="#content">
        {t.skip}
      </a>
      <Header lang={lang} section={section} t={t} labels={labels} show={show} arcade={arcade} />
      <main id="content" className={"page-" + page}>
        {content}
      </main>
      <Footer lang={lang} t={t} labels={labels} show={show} arcade={arcade} copy={copy} />
      <Lightbox controls={copy.explore.preview} />
      {data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
      )}
      {section === "play" && <script defer src={"/play.js?v=" + version("play.js")} />}
    </>
  );
}
