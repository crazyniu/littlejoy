import { games } from "./portfolio.mjs";

export const routes = [
  "",
  "games",
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
  ...Object.fromEntries(games.map(({ slug }) => ["games/" + slug, "games"])),
};
