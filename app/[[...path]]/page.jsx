import { notFound } from "next/navigation";
import { contact, dictionary, legalDocument } from "../../lib/catalog";
import { address, languages, readPath } from "../../lib/languages";
import { routes } from "../../lib/routes.mjs";
import editorial from "../../lib/editorial.json";
import { StudioHome, About, ContactPage } from "../StudioPages";
import siteCopy from "../../lib/site-copy.json";
import showcase from "../../lib/showcase.json";
import PageBanner from "../PageBanner";
import LanguagePicker from "../LanguagePicker";
import Portfolio from "../Portfolio";
import SiteHeader from "../SiteHeader";
import Effects from "../Effects";
import { PixelSprite } from "../Pixel";

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(languages).flatMap((lang) =>
    routes.map((section) => ({
      path: section ? [lang, section] : [lang],
    })),
  );
}

export async function generateMetadata({ params }) {
  const { lang, section } = readPath((await params).path);
  if (!routes.includes(section)) notFound();
  const { ui } = await dictionary(lang);
  const policy = section === "privacy" || section === "terms";
  const labels = siteCopy[lang];
  const title = section
    ? (section === "games"
        ? editorial[lang].work
        : labels[section] || ui[section]) + " | Littlejoy Games"
    : "Littlejoy Games — " + ui.indie;
  const description = policy
    ? (await legalDocument(lang, section)).intro
    : section === "about"
      ? [labels.team, labels.location].join(" ")
      : section === "games"
        ? editorial[lang].catalog
        : labels[section + "Intro"] || editorial[lang].lead;
  const alternates = Object.fromEntries(
    Object.entries(languages).map(([key, locale]) => [
      locale.tag,
      address(key, section),
    ]),
  );
  return {
    title,
    description,
    alternates: {
      canonical: address(lang, section),
      languages: {
        ...alternates,
        "x-default": section ? "/" + section + "/" : "/",
      },
    },
    openGraph: {
      title,
      description,
      url: address(lang, section),
      siteName: "Littlejoy Games",
      images: ["/art/site/island.webp"],
    },
  };
}

function Header({ lang, section, t, labels, show }) {
  const links = [
    ["", labels.home],
    ["about", labels.about],
    ["games", editorial[lang].work],
    ["contact", labels.contact],
  ].map(([target, label]) => ({
    href: address(lang, target),
    label,
    current: section === target,
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
      <LanguagePicker lang={lang} section={section} label={t.language} />
    </SiteHeader>
  );
}

function Footer({ lang, t, labels, show }) {
  const story = editorial[lang];
  const columns = [
    [
      "Littlejoy Games",
      [
        [address(lang), labels.home],
        [address(lang, "about"), labels.about],
        [address(lang, "games"), story.work],
        [address(lang, "contact"), labels.contact],
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
          v2.0 · <span className="blink">▮</span>
        </span>
      </div>
      <a className="to-top" href="#top" aria-label={show.top}>
        <PixelSprite name="up" size={3} />
      </a>
    </footer>
  );
}

function BootScreen() {
  return (
    <div className="boot" aria-hidden="true">
      <div className="boot-inner">
        <PixelSprite name="logo" size={9} />
        <p className="boot-title">LITTLEJOY GAMES</p>
        <div className="boot-bar">
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ "--i": i }} />
          ))}
        </div>
        <p className="boot-press">PRESS START</p>
      </div>
    </div>
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
  if (!routes.includes(section)) notFound();
  const copy = await dictionary(lang);
  const t = copy.ui;
  const labels = siteCopy[lang];
  const story = editorial[lang];
  const show = showcase[lang];
  const props = { lang, copy, labels, story, show };
  let content;
  if (!section) {
    content = <StudioHome {...props} />;
  } else if (section === "games") {
    content = <Portfolio {...props} />;
  } else if (section === "about") {
    content = <About {...props} />;
  } else if (section === "contact" || section === "support") {
    content = <ContactPage {...props} support={section === "support"} />;
  } else {
    content = (
      <DocumentPage lang={lang} section={section} t={t} labels={labels} show={show} />
    );
  }

  return (
    <>
      <div id="top" />
      {!section && <BootScreen />}
      <a className="skip" href="#content">
        {t.skip}
      </a>
      <Header lang={lang} section={section} t={t} labels={labels} show={show} />
      <main id="content" className={"page-" + (section || "home")}>
        {content}
      </main>
      <Footer lang={lang} t={t} labels={labels} show={show} />
      <Effects />
    </>
  );
}
