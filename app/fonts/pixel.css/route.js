import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-static";

const pixelFaces = [
  { family: "Silkscreen", file: "silkscreen.woff2", weight: 700 },
  { family: "Littlejoy Display", file: "littlejoy-display.woff2", weight: 400 },
  {
    family: "Littlejoy International",
    file: "littlejoy-international.woff2",
    weight: 400,
  },
];

// Build one cacheable stylesheet with the font bytes already available at first paint.
export async function GET() {
  const faces = await Promise.all(
    pixelFaces.map(async ({ family, file, weight }) => {
      const bytes = await readFile(
        join(process.cwd(), "public", "fonts", file),
      );
      return `@font-face {
      font-family: "${family}";
      src: url("data:font/woff2;base64,${bytes.toString("base64")}") format("woff2");
      font-weight: ${weight};
      font-style: normal;
      font-display: block;
    }`;
    }),
  );
  return new Response(faces.join("\n"), {
    headers: { "Content-Type": "text/css; charset=utf-8" },
  });
}
