/**
 * Mirrors the color tokens in src/app/globals.css for contexts that can't
 * read CSS custom properties (SVG chart fills). Keep these two files in
 * sync — see docs/design-system.md.
 */
export const palette = {
  ink: "#211f1c",
  paper: "#faf6ef",
  a: "#c1633b",
  b: "#5f8575",
  gold: "#c9a227",
  danger: "#c0392b",
  inkSecondary: "#52514e",
  gridline: "#e1e0d9",
} as const;

/**
 * Categorical palette for charts needing per-slice identity (pie/donut,
 * >2 series) — the app's own brand colors (--a/--b/--gold) are reserved for
 * their semantic roles, not general category identity, so this is the
 * dataviz skill's validated 8-hue default. Fixed order is the CVD-safety
 * mechanism — never reshuffle per-render. Validated via
 * scripts/validate_palette.js against the --paper surface (#faf6ef):
 * all checks pass; 4 slots warn below 3:1 contrast, mitigated by always
 * pairing slices with direct % labels + the text list (never color-alone).
 */
export const categoricalPalette = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
] as const;
