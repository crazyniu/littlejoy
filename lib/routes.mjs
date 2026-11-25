import { games } from "./portfolio.mjs";

// Game detail pages live under games/<slug>.
export const gameRoutes = games.map(({ slug }) => "games/" + slug);

export const routes = [
  "",
  "games",
  ...gameRoutes,
  "play",
  "about",
  "contact",
  "support",
  "privacy",
  "terms",
];

export const legacyRoutes = {
  studio: "about",
  guide: "games",
  worlds: "games",
};
