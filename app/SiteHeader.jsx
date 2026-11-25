"use client";
import { useEffect, useState } from "react";
import { PixelSprite } from "./Pixel";

export default function SiteHeader({
  home,
  links,
  navLabel,
  menuLabel,
  closeLabel,
  email,
  children,
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("menu-open", open);
    if (open) root.classList.remove("header-hidden");
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onWide = (e) => e.matches && setOpen(false);
    const wide = matchMedia("(min-width: 960px)");
    addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

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
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? closeLabel : menuLabel}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="burger" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>
      <div
        id="mobile-menu"
        className="mobile-menu"
        data-open={open}
        inert={!open}
      >
        <nav aria-label={navLabel}>
          <ol>
            {links.map(({ href, label, current }, i) => (
              <li key={href} style={{ "--i": i }}>
                <a
                  href={href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
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
