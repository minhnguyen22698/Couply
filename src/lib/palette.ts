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
