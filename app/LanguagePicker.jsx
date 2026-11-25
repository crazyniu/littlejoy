import { address, languages } from "../lib/languages";
import { PixelSprite } from "./Pixel";

// Native <select> (site.js navigates on change) with a link list for no-JS.
export default function LanguagePicker({ lang, section, label }) {
  const choices = Object.entries(languages);
  const current = languages[lang];
  const display = (
    <>
      <PixelSprite name="globe" size={2} />
      <span lang={current.tag}>{current.short}</span>
    </>
  );
  return (
    <div className="picker">
      <label>
        <span className="picker-display" aria-hidden="true">
          {display}
        </span>
        <select name="language" aria-label={label} defaultValue={lang} data-lang>
          {choices.map(([code, { name, tag }]) => (
            <option key={code} value={code} lang={tag} data-href={address(code, section)}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <style>{".picker label{display:none}"}</style>
        <details>
          <summary className="picker-display" aria-label={label + " · " + current.name}>
            {display}
          </summary>
          <ul>
            {choices.map(([code, { name, tag }]) => (
              <li key={code}>
                <a
                  lang={tag}
                  hrefLang={tag}
                  aria-current={code === lang ? "page" : undefined}
                  href={address(code, section)}
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </noscript>
    </div>
  );
}
