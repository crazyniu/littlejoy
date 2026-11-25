"use client";
import { useState } from "react";
import { address, languages } from "../lib/languages";

export default function LanguagePicker({ lang, section, label }) {
  const [flagUnavailable, setFlagUnavailable] = useState(false);
  const choices = Object.entries(languages);
  const current = languages[lang];
  const display = (
    <>
      <span className="picker-flag" aria-hidden="true">
        {lang !== "zh-hant" ? (
          current.flag
        ) : flagUnavailable ? (
          "🇨🇳"
        ) : (
          <img
            src="/flags/hk.png"
            alt="🇨🇳"
            width="20"
            height="20"
            ref={(image) => {
              if (image?.complete && image.naturalWidth === 0)
                setFlagUnavailable(true);
            }}
            onError={() => setFlagUnavailable(true)}
          />
        )}
      </span>
      <span lang={current.tag}>{current.short}</span>
    </>
  );
  return (
    <div className="picker">
      <label>
        <span className="picker-display" aria-hidden="true">
          {display}
        </span>
        <select
          name="language"
          aria-label={label}
          value={lang}
          onChange={(event) => {
            window.location.assign(
              address(event.target.value, section) + window.location.hash,
            );
          }}
        >
          {choices.map(([code, { name, tag }]) => (
            <option key={code} value={code} lang={tag}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <style>{".picker label{display:none}"}</style>
        <details>
          <summary
            className="picker-display"
            aria-label={label + " · " + current.name}
          >
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
