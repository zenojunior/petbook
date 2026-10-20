import { describe, expect, it } from "vitest";
import { coverColors, pickCoverColor } from "./book-cover";

describe("pickCoverColor", () => {
  it("gives the same color for the same seed", () => {
    expect(pickCoverColor("a1b2c3d4")).toBe(pickCoverColor("a1b2c3d4"));
  });

  it("always picks a color from the palette", () => {
    for (const seed of ["", "x", "a1b2c3d4", "ffffffff", "🐶"]) {
      expect(coverColors).toContain(pickCoverColor(seed));
    }
  });

  it("spreads different seeds over more than one color", () => {
    const seeds = Array.from({ length: 50 }, (_, i) => `seed-${i}`);
    const colors = new Set(seeds.map(pickCoverColor));
    expect(colors.size).toBeGreaterThan(1);
  });
});
