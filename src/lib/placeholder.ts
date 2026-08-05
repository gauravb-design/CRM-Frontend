import { letterMark } from "./format";

/**
 * Placeholder artwork drawn as an inline SVG data URI.
 *
 * A hosted placeholder service would be a network request on every row and a
 * broken-image icon the moment the box is offline or behind a strict CSP.
 * This is deterministic from the seed, so a profile keeps the same tile
 * between reloads, and it costs nothing.
 */

/** Backgrounds taken from the app palette so tiles never clash with the page. */
const TINTS: Array<[bg: string, fg: string]> = [
  ["#E8F0EC", "#1B4D3E"],
  ["#EEF1F6", "#3A4A63"],
  ["#F2F0EC", "#7A7D85"],
  ["#FDF3E0", "#8A5A00"],
];

const hash = (s: string) => {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 100_000;
  return n;
};

export function placeholderImage(seed: string, size = 48): string {
  const n = hash(seed);
  const [bg, fg] = TINTS[n % TINTS.length];
  const mark = letterMark(seed);

  // Two off-centre circles give it the weight of artwork rather than a swatch.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">` +
    `<rect width="48" height="48" fill="${bg}"/>` +
    `<circle cx="${10 + (n % 12)}" cy="${34 + (n % 7)}" r="${13 + (n % 6)}" fill="${fg}" opacity="0.10"/>` +
    `<circle cx="${36 - (n % 9)}" cy="${12 + (n % 5)}" r="${9 + (n % 5)}" fill="${fg}" opacity="0.08"/>` +
    `<text x="24" y="24" fill="${fg}" font-family="DM Sans, system-ui, sans-serif" font-size="16"` +
    ` font-weight="600" text-anchor="middle" dominant-baseline="central">${mark}</text>` +
    `</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
