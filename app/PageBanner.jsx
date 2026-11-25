export default function PageBanner({
  title,
  intro,
  children,
  artwork,
  compact = false,
}) {
  return (
    <header className={compact ? "studio-band compact-band" : "studio-band"}>
      <div
        className={
          artwork ? "shell band-inner illustrated-band" : "shell band-inner"
        }
      >
        <div className="band-copy">
          <h1>
            {title}
            <span className="heading-dot" aria-hidden="true">
              .
            </span>
          </h1>
          <p className="band-intro">{intro}</p>
          {children}
        </div>
        {artwork}
      </div>
    </header>
  );
}
