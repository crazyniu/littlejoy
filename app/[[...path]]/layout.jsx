import "../style.css";
import "../pixel-site.css";
import { languages, readPath } from "../../lib/languages";

export const metadata = {
  metadataBase: new URL("https://shopkivoo.com"),
  icons: { icon: "/icon.png" },
};

export default async function RootLayout({ children, params }) {
  const { path } = await params;
  const { lang } = readPath(path);
  return (
    <html lang={languages[lang].tag}>
      <head>
        <link rel="stylesheet" href="/fonts/pixel.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
