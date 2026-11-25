"use client";
import { useState } from "react";

export default function CatalogFilter({ options }) {
  const [active, setActive] = useState("all");
  function choose(key) {
    setActive(key);
    const catalog = document.querySelector("[data-catalog]");
    catalog.dataset.filter = key;
    // Newly shown items should not wait for a scroll to appear.
    catalog
      .querySelectorAll(`[data-group="${key}"] [data-reveal]`)
      .forEach((el) => el.classList.add("is-in"));
    const top = catalog.getBoundingClientRect().top + scrollY - 90;
    if (scrollY > top) scrollTo({ top, behavior: "smooth" });
  }
  return (
    <div className="filter-bar">
      <div className="shell filter-inner" role="group">
        {options.map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            className="filter-btn"
            aria-pressed={active === key}
            onClick={() => choose(key)}
          >
            {label}
            <span className="filter-count">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
