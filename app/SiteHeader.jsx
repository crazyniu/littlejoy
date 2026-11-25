import { PixelSprite } from "./Pixel";

// Header + full-screen mobile menu. The menu button is wired up in site.js.
export default function SiteHeader({ home, links, navLabel, menuLabel, closeLabel, email, children }) {
  return (
    <header className="mast">
      <div className="scroll-meter" aria-hidden="true" />
      <div className="shell mast-inner">
        <a className="brand" href={home} aria-label="Littlejoy Games">
          <PixelSprite name="logo" size={3} />
          <span className="wordmark">
            littlejoy<span className="wordmark-games">games</span>
          </span>
        </a>
        <nav className="site-nav" aria-label={navLabel}>
          <ul>
            {links.map(({ href, label, current }) => (
              <li key={href}>
                <a href={href} aria-current={current ? "page" : undefined}>
                  <span className="nav-cursor" aria-hidden="true">
                    ▶
                  </span>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mast-actions">
          {children}
          <button
            type="button"
            className="menu-toggle"
            aria-expanded="false"
            aria-controls="mobile-menu"
            aria-label={menuLabel}
            data-menu
            data-open={menuLabel}
            data-close={closeLabel}
          >
            <span className="burger" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>
      <div id="mobile-menu" className="mobile-menu" data-open="false" inert>
        <nav aria-label={navLabel}>
          <ol>
            {links.map(({ href, label, current }, i) => (
              <li key={href} style={{ "--i": i }}>
                <a href={href} aria-current={current ? "page" : undefined}>
                  <span className="mm-index">0{i + 1}</span>
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <a className="mm-mail" href={"mailto:" + email}>
          <PixelSprite name="mail" size={3} />
          {email}
        </a>
        <div className="mm-sprites" aria-hidden="true">
          <PixelSprite name="fish" size={5} />
          <PixelSprite name="bird" size={5} />
          <PixelSprite name="star" size={4} />
        </div>
      </div>
    </header>
  );
}
