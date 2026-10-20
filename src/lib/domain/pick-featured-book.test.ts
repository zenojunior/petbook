import { describe, expect, it } from "vitest";
import { pickFeaturedBook } from "./pick-featured-book";

const books = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("pickFeaturedBook", () => {
  it("returns the pinned book when it is published", () => {
    expect(pickFeaturedBook(books, "b", () => 0)).toEqual({ id: "b" });
  });

  it("picks at random when nothing is pinned", () => {
    expect(pickFeaturedBook(books, null, () => 0.5)).toEqual({ id: "b" });
  });

  it("falls back to a random book when the pinned one is not published", () => {
    expect(pickFeaturedBook(books, "gone", () => 0)).toEqual({ id: "a" });
  });

  it("stays in range when random returns a value just below 1", () => {
    expect(pickFeaturedBook(books, null, () => 0.999999)).toEqual({ id: "c" });
  });

  it("returns null when no book is published", () => {
    expect(pickFeaturedBook([], "a", () => 0)).toBeNull();
  });
});
