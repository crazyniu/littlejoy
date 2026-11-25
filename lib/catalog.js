export const contact = "shopkivoo2026@gmail.com";

export async function dictionary(lang) {
  const copy = await import("./locales/" + lang + ".json");
  return copy.default;
}

export async function legalDocument(lang, section) {
  const legal = await import("./locales/" + lang + "-legal.json");
  return legal.default[section];
}

export function storePoster(game, index, caption) {
  const art = {
    src: "/art/store/" + game.slug + "-" + game.posters[index] + ".webp",
    width: 1080,
    height: 1620,
    caption,
  };
  if (index === 0) {
    art.thumbnail = {
      src: "/art/covers/" + game.slug + ".webp",
      width: 720,
      height: 1080,
    };
  }
  return art;
}
