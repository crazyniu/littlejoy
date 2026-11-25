import "../site.css";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { languages, readPath } from "../../lib/languages";

export const metadata = {
  metadataBase: new URL("https://shopkivoo.com"),
  icons: { icon: "/icon.png", apple: "/apple-touch-icon.png" },
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  themeColor: "#0b0817",
  colorScheme: "dark",
};

const siteScript =
  "/site.js?v=" +
  createHash("sha256")
    .update(readFileSync(join(process.cwd(), "public", "site.js")))
    .digest("hex")
    .slice(0, 10);

// Runs before first paint: enables motion styles (failing open if site.js
// never arrives) and points the page-transition iris at the clicked spot.
const bootScript = `(function(){var d=document.documentElement;d.classList.add("js");setTimeout(function(){if(!d.classList.contains("fx-ready"))d.classList.remove("js")},3500);addEventListener("pagereveal",function(e){if(!e.viewTransition)return;try{var p=JSON.parse(sessionStorage.getItem("lj-vt"));sessionStorage.removeItem("lj-vt");if(p){d.style.setProperty("--vt-x",p[0]*100+"%");d.style.setProperty("--vt-y",p[1]*100+"%")}}catch(x){}})})();`;

// Fonts every page needs at first paint, plus the script-specific ones.
const fonts = {
  base: ["silkscreen", "littlejoy-display", "bricolage"],
  zh: ["littlejoy-display-cjk"],
  "zh-hant": ["littlejoy-display-cjk"],
  ja: ["littlejoy-display-cjk"],
  ko: ["littlejoy-display-cjk"],
  th: ["littlejoy-international"],
};

export default async function RootLayout({ children, params }) {
  const { path } = await params;
  const { lang } = readPath(path);
  return (
    <html lang={languages[lang].tag} suppressHydrationWarning>
      <head>
        {[...fonts.base, ...(fonts[lang] ?? [])].map((name) => (
          <link
            key={name}
            rel="preload"
            href={"/fonts/" + name + ".woff2"}
            as="font"
            type="font/woff2"
            crossOrigin=""
          />
        ))}
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <script defer src={siteScript} />
      </head>
      <body>{children}</body>
    </html>
  );
}
