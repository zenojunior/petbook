import { describe, expect, it } from "vitest";
import { canReadBookImages, opensByPublicLink, opensBySharedLink, visibilityOf } from "./book-access";

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

describe("deleted book images", () => {
  const deleted = { status: "published" as const, ownerId: "author", shareToken: "secret", deletedAt: new Date("2026-01-01") };
  it("denies anonymous access even with the old share token", () => {
    expect(canReadBookImages(deleted, null, "secret")).toBe(false);
  });
  it("denies the former owner", () => {
    expect(canReadBookImages(deleted, { id: "author", role: "user" }, null)).toBe(false);
  });
  it("retains administrator access", () => {
    expect(canReadBookImages(deleted, { id: "admin", role: "admin" }, null)).toBe(true);
  });
  it("keeps active public images readable", () => {
    expect(canReadBookImages({ ...deleted, deletedAt: null }, null, null)).toBe(true);
  });
  it("does not leak an active private draft without a valid token", () => {
    expect(canReadBookImages({ ...deleted, status: "draft", deletedAt: null }, null, "wrong")).toBe(false);
    expect(canReadBookImages({ ...deleted, status: "draft", deletedAt: null }, null, "secret")).toBe(true);
  });
});
