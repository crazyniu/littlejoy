import "../site.css";
import { languages, readPath } from "../../lib/languages";

export const metadata = {
  metadataBase: new URL("https://shopkivoo.com"),
  icons: { icon: "/icon.png" },
};

export const viewport = {
  themeColor: "#0b0817",
  colorScheme: "dark",
};

// Runs before paint: enables motion styles, skips the boot screen when
// arriving from another page of this site, and fails open if scripts stall.
const bootScript = `(function(){var d=document.documentElement;d.classList.add("js");try{if(document.referrer&&new URL(document.referrer).host===location.host)d.classList.add("no-boot")}catch(e){}setTimeout(function(){if(!d.classList.contains("fx-ready"))d.classList.remove("js")},3500)})();`;

export default async function RootLayout({ children, params }) {
  const { path } = await params;
  const { lang } = readPath(path);
  return (
    <html lang={languages[lang].tag} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/fonts/pixel.css" />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
