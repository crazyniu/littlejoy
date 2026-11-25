// Filter buttons for the catalog; site.js sets data-filter on [data-catalog].
export default function CatalogFilter({ options }) {
  return (
    <div className="filter-bar">
      <div className="shell filter-inner" role="group">
        {options.map(([key, label, count], i) => (
          <button
            key={key}
            type="button"
            className="filter-btn"
            aria-pressed={i === 0 ? "true" : "false"}
            data-filter={key}
          >
            {label}
            <span className="filter-count">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
