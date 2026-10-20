import { describe, expect, it } from "vitest";
import { opensByPublicLink, opensBySharedLink, visibilityOf } from "./book-access";

describe("visibilityOf", () => {
  it("is private for a draft without a share link", () => {
    expect(visibilityOf({ status: "draft", shareToken: null })).toBe("private");
  });

  it("is link for a draft with a share link", () => {
    expect(visibilityOf({ status: "draft", shareToken: "abc" })).toBe("link");
  });

  it("is public once published, with or without a share link", () => {
    expect(visibilityOf({ status: "published", shareToken: null })).toBe("public");
    expect(visibilityOf({ status: "published", shareToken: "abc" })).toBe("public");
  });
});

describe("opensBySharedLink", () => {
  it("opens drafts and books waiting for review", () => {
    expect(opensBySharedLink("draft")).toBe(true);
    expect(opensBySharedLink("in_review")).toBe(true);
    expect(opensBySharedLink("needs_human")).toBe(true);
  });

  it("does not open a rejected book", () => {
    expect(opensBySharedLink("rejected")).toBe(false);
  });
});

describe("opensByPublicLink", () => {
  it("opens only published books", () => {
    expect(opensByPublicLink("published")).toBe(true);
    for (const status of ["draft", "in_review", "rejected", "needs_human"] as const) {
      expect(opensByPublicLink(status)).toBe(false);
    }
  });
});
