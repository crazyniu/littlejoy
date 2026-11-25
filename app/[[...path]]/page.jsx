import { notFound } from "next/navigation";
import { contact, dictionary, legalDocument } from "../../lib/catalog";
import { address, languages, readPath } from "../../lib/languages";
import { routes } from "../../lib/routes.mjs";
import editorial from "../../lib/editorial.json";
import { StudioHome, About, ContactPage } from "../StudioPages";
import siteCopy from "../../lib/site-copy.json";
import PageBanner from "../PageBanner";
import LanguagePicker from "../LanguagePicker";
import Portfolio from "../Portfolio";

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

function Wordmark() {
  return (
    <span className="wordmark">
      <span className="joy-mark" aria-hidden="true">
        <i />
      </span>
      littlejoy
    </span>
  );
}

function Header({ lang, section, t, labels }) {
  const links = [
    ["", labels.home],
    ["about", labels.about],
    ["games", editorial[lang].work],
    ["contact", labels.contact],
  ];
  return (
    <header className="mast">
      <div className="shell mast-inner">
        <a className="brand" href={address(lang)} aria-label="Littlejoy Games">
          <Wordmark />
        </a>
        <nav className="site-nav" aria-label={t.navigation}>
          <ul>
            {links.map(([target, label]) => (
              <li key={target}>
                <a
                  href={address(lang, target)}
                  aria-current={section === target ? "page" : undefined}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <LanguagePicker lang={lang} section={section} label={t.language} />
      </div>
    </header>
  );
}

function Footer({ lang, t, labels }) {
  return (
    <footer className="site-footer">
      <div className="shell foot-inner">
        <span className="copyright">© 2026 Littlejoy Games</span>
        <nav aria-label={t.policies}>
          <a href={address(lang, "support")}>{labels.support}</a>
          <a href={address(lang, "privacy")}>{t.privacy}</a>
          <a href={address(lang, "terms")}>{t.terms}</a>
        </nav>
      </div>
    </footer>
  );
}

async function DocumentPage({ lang, section, t, labels }) {
  const policyUpdated = section === "privacy" ? "2026-11-25" : "2026-11-19";
  const date = new Intl.DateTimeFormat(languages[lang].tag, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(policyUpdated));
  const doc = await legalDocument(lang, section);
  const other = section === "privacy" ? "terms" : "privacy";
  const contents = (
    <nav aria-label={t.policyNav}>
      {doc.sections.map(([id, title]) => (
        <a key={id} href={"#" + id}>
          {title}
        </a>
      ))}
    </nav>
  );
  return (
    <div className="document">
      <PageBanner title={t[section]} intro={doc.intro} compact>
        <div className="doc-meta">
          <p className="effective">
            {labels.updated} <time dateTime={policyUpdated}>{date}</time>
          </p>
          <a href="#policy-contact">
            {section === "privacy" ? t.privacyContact : t.termsContact}
          </a>
        </div>
      </PageBanner>
      <div className="shell doc-grid">
        <aside>
          <div className="toc-desktop">
            <h2>{t.policyNav}</h2>
            {contents}
          </div>
          <details className="toc-mobile">
            <summary>{t.policyNav}</summary>
            {contents}
          </details>
        </aside>
        <article className="doc-copy">
          {doc.sections.map(([id, title, paragraphs]) => (
            <section id={id} key={id}>
              <h2>{title}</h2>
              {paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
          ))}
          <div className="contact-box" id="policy-contact">
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
              ].map(([name, url]) => (
                <a key={name} href={url}>
                  {name} · {t.privacy} ↗
                </a>
              ))}
            </div>
          )}
          <a className="related-doc" href={address(lang, other)}>
            {t[other]} ↗
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
  let content;
  if (!section) {
    content = (
      <StudioHome lang={lang} copy={copy} labels={labels} story={story} />
    );
  } else if (section === "games") {
    content = <Portfolio lang={lang} copy={copy} story={story} />;
  } else if (section === "about") {
    content = <About lang={lang} labels={labels} copy={copy} story={story} />;
  } else if (section === "contact" || section === "support") {
    content = (
      <ContactPage
        lang={lang}
        labels={labels}
        story={story}
        copy={copy}
        support={section === "support"}
      />
    );
  } else {
    content = (
      <DocumentPage lang={lang} section={section} t={t} labels={labels} />
    );
  }

  return (
    <>
      <a className="skip" href="#content">
        {t.skip}
      </a>
      <Header lang={lang} section={section} t={t} labels={labels} />
      <main
        id="content"
        className={
          section === "privacy" || section === "terms"
            ? "reading-page"
            : undefined
        }
      >
        {content}
      </main>
      <Footer lang={lang} t={t} labels={labels} />
    </>
  );
}
