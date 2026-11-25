export const games = [
  {
    slug: "bubble-fish",
    color: "aqua",
    posters: ["1", "2", "3", "4", "5"],
    backdrop: "/art/ocean.webp",
    mascots: ["/art/clownfish.webp", "/art/little-fish.webp"],
    sprite: "fish",
    // [number, label key in locale explore.labels]
    stats: [
      [360, "levels"],
      [18, "seas"],
      [705, "creatures"],
    ],
  },
  {
    slug: "fly-home",
    color: "leaf",
    posters: ["flock", "homecoming", "forests", "outfits", "chest"],
    backdrop: "/art/jungle.webp",
    mascots: ["/art/sunbird.webp", "/art/bluebird.webp"],
    sprite: "bird",
    stats: [
      [210, "levels"],
      [10, "forests"],
      [3, "stars"],
    ],
  },
];

export const concepts = [
  "bubble-garden",
  "sand-lines",
  "sorting-studio",
  "fresh-coat",
  "perfect-slices",
  "tiny-tidy",
  "rainy-teahouse",
  "moonlit-kiln",
  "otter-post",
  "woodland-loom",
  "melody-lanterns",
  "star-isle-railway",
  "moss-jar-cottage",
  "hedgehog-tailor",
  "capybara-springs",
  "paperwing-harbor",
  "sea-glass-mosaic",
  "squirrel-breadhouse",
];

// Studio-wide totals shown in the stats strip.
export const totals = {
  levels: games.reduce((sum, g) => sum + g.stats[0][0], 0),
  worlds: 18 + 10,
  creatures: 705,
  concepts: concepts.length,
};

// Artwork slots waiting for generated art. Drop the file in /public at this
// path and rebuild; until then a placeholder frame is shown.
export const artSlots = {
  "bubble-fish": { src: "/art/slots/bubble-fish-keyart.webp", width: 1600, height: 900 },
  "fly-home": { src: "/art/slots/fly-home-keyart.webp", width: 1600, height: 900 },
  team: { src: "/art/slots/team-portrait.webp", width: 1200, height: 900 },
  city: { src: "/art/slots/los-angeles-skyline.webp", width: 2100, height: 900 },
};
