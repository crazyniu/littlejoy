export const languages = {
  en: { name: "English", tag: "en", flag: "🇺🇸", short: "EN" },
  zh: { name: "简体中文", tag: "zh-CN", flag: "🇨🇳", short: "简中" },
  "zh-hant": { name: "繁體中文", tag: "zh-Hant", flag: "🇭🇰", short: "繁中" },
  ja: { name: "日本語", tag: "ja", flag: "🇯🇵", short: "JA" },
  ko: { name: "한국어", tag: "ko", flag: "🇰🇷", short: "KO" },
  vi: { name: "Tiếng Việt", tag: "vi", flag: "🇻🇳", short: "VI" },
  th: { name: "ไทย", tag: "th", flag: "🇹🇭", short: "TH" },
  id: { name: "Bahasa Indonesia", tag: "id", flag: "🇮🇩", short: "ID" },
  fr: { name: "Français", tag: "fr", flag: "🇫🇷", short: "FR" },
  de: { name: "Deutsch", tag: "de", flag: "🇩🇪", short: "DE" },
  es: { name: "Español", tag: "es", flag: "🇪🇸", short: "ES" },
  it: { name: "Italiano", tag: "it", flag: "🇮🇹", short: "IT" },
  "pt-br": {
    name: "Português (Brasil)",
    tag: "pt-BR",
    flag: "🇧🇷",
    short: "PT-BR",
  },
  ru: { name: "Русский", tag: "ru", flag: "🇷🇺", short: "RU" },
};

export function address(lang, section = "") {
  const parts = [lang, section].filter(Boolean);
  return parts.length ? "/" + parts.join("/") + "/" : "/";
}

export function readPath(path = []) {
  const localized = Object.hasOwn(languages, path[0]);
  return {
    lang: localized ? path[0] : "en",
    section: (localized ? path.slice(1) : path).join("/"),
  };
}
