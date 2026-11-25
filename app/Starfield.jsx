// Pixel starfield canvas, animated by site.js (pauses when off-screen).
// `critters` adds the hero flock and the bubbles that pop under the cursor.
export default function Starfield({ density = 1, critters = false }) {
  return (
    <canvas
      className="starfield"
      data-density={density}
      data-critters={critters ? "" : undefined}
      aria-hidden="true"
    />
  );
}
