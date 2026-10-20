import { describe, expect, it } from "vitest";
import { rankTables } from "./rank-tables";

describe("rankTables", () => {
  it("puts a table one column to the right of the deepest table it references", () => {
    const ranks = rankTables([
      { name: "pages", dependsOn: ["books"] },
      { name: "books", dependsOn: ["pets", "user"] },
      { name: "pets", dependsOn: ["user"] },
      { name: "user", dependsOn: [] },
    ]);

    expect(Object.fromEntries(ranks)).toEqual({ user: 0, pets: 1, books: 2, pages: 3 });
  });

  it("ignores a table referencing itself", () => {
    const ranks = rankTables([{ name: "comments", dependsOn: ["comments"] }]);

    expect(ranks.get("comments")).toBe(0);
  });

  it("terminates on a cycle", () => {
    const ranks = rankTables([
      { name: "a", dependsOn: ["b"] },
      { name: "b", dependsOn: ["a"] },
    ]);

    expect(ranks.size).toBe(2);
  });
});
