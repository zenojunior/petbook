import { describe, expect, it } from "vitest";
import { makeSlug } from "./make-slug";

describe("makeSlug", () => {
  it("joins lowercase words with dashes and appends the suffix", () => {
    expect(makeSlug("Thor's Big Adventure", "a1b2c3")).toBe("thor-s-big-adventure-a1b2c3");
  });

  it("removes accents", () => {
    expect(makeSlug("Café da manhã", "x9")).toBe("cafe-da-manha-x9");
  });

  it("falls back to 'book' when the title has no usable characters", () => {
    expect(makeSlug("🐶🐱", "x9")).toBe("book-x9");
  });

  it("keeps long titles short without a trailing dash", () => {
    const slug = makeSlug(`${"a".repeat(59)} b`, "x9");
    expect(slug).toBe(`${"a".repeat(59)}-x9`);
  });
});
