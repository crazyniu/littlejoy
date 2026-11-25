import { languages, address, readPath } from "./lib/languages.js";
import { legacyRoutes, routes } from "./lib/routes.mjs";

function preferredLanguage(header) {
  const preferences = header
    .split(",")
    .map((entry) => {
      const [tag, weight] = entry
        .trim()
        .toLowerCase()
        .split(/\s*;\s*q=/);
      return { tag, quality: weight === undefined ? 1 : Number(weight) };
    })
    .filter(({ quality }) => quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of preferences) {
    const [base, ...subtags] = tag.split("-");
    if (base === "zh") {
      if (subtags.includes("hans")) return "zh";
      if (subtags.some((part) => ["hant", "hk", "tw", "mo"].includes(part)))
        return "zh-hant";
      return "zh";
    }
    if (base === "pt") return "pt-br";
    if (Object.hasOwn(languages, base)) return base;
  }
  return "en";
}

export default {
  async fetch(request, env) {
    const target = new URL(request.url);
    const path = target.pathname.split("/").filter(Boolean);
    const { lang: routeLanguage, section } = readPath(path);
    if (!["GET", "HEAD"].includes(request.method)) {
      return env.ASSETS.fetch(request);
    }

    const hasLanguage = Object.hasOwn(languages, path[0]);
    const lang = hasLanguage
      ? routeLanguage
      : preferredLanguage(request.headers.get("Accept-Language") || "");
    if (Object.hasOwn(legacyRoutes, section)) {
      target.pathname = address(lang, legacyRoutes[section]);
      return new Response(null, {
        status: hasLanguage ? 308 : 302,
        headers: {
          Location: target.href,
          ...(hasLanguage
            ? {}
            : {
                Vary: "Accept-Language",
                "Cache-Control": "private, no-store",
              }),
        },
      });
    }
    if (hasLanguage || !routes.includes(section)) {
      return env.ASSETS.fetch(request);
    }
    target.pathname = address(lang, section);
    const headers = {
      Vary: "Accept-Language",
      "Cache-Control": "private, no-store",
    };
    if (lang !== "en") {
      return new Response(null, {
        status: 302,
        headers: { ...headers, Location: target.href },
      });
    }
    const asset = await env.ASSETS.fetch(new Request(target, request));
    const response = new Response(asset.body, asset);
    response.headers.append("Vary", "Accept-Language");
    response.headers.set("Cache-Control", headers["Cache-Control"]);
    return response;
  },
};
