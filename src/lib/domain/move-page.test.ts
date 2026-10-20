import { describe, expect, it } from "vitest";
import { movePage } from "./move-page";

describe("movePage", () => {
  it("moves a page down", () => {
    expect(movePage(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("moves a page up", () => {
    expect(movePage(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("does not change the input array", () => {
    const pages = ["a", "b"];
    movePage(pages, 0, 1);
    expect(pages).toEqual(["a", "b"]);
  });

  it("ignores an index outside the book", () => {
    expect(movePage(["a", "b"], 0, 2)).toEqual(["a", "b"]);
    expect(movePage(["a", "b"], -1, 0)).toEqual(["a", "b"]);
  });
});
