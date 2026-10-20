// The look of a book's cover: one color from a closed palette and one pattern printed on it.
// The palette is closed so every cover keeps readable text and the shelf looks good together.
// The actual colors live in src/styles/tokens.app.css under [data-cover="<color>"].

export const coverColors = [
  "sage",
  "sky",
  "lavender",
  "rose",
  "peach",
  "butter",
  "terracotta",
  "forest",
  "navy",
  "cocoa",
] as const;

export type CoverColor = (typeof coverColors)[number];

export const coverPatterns = ["plain", "stripes", "dots", "paws", "check"] as const;

export type CoverPattern = (typeof coverPatterns)[number];

export const defaultCoverPattern: CoverPattern = "paws";

// A starting color for a new book, picked from a seed (the book's random suffix) so a shelf of
// new books is not all the same color. The same seed always gives the same color.
export function pickCoverColor(seed: string): CoverColor {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return coverColors[hash % coverColors.length];
}
