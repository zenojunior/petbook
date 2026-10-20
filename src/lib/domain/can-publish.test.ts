import { describe, expect, it } from "vitest";
import { canPublish, type PublishableBook } from "./can-publish";
import { transition } from "./transition";
import { ruleCheck } from "../moderation/rule-check";

const id = "11111111-1111-4111-8111-111111111111";
const image = `/api/images/books/${id}/11111111-1111-4111-8111-111111111111.webp`;
const complete: PublishableBook = {
  id, title: "Luna", coverUrl: image,
  pet: { name: "Luna", species: "cat", city: "Lisbon", lat: 38.72, lng: -9.14 },
  pages: [{ layout: "text", text: "Our first day together.", imageUrl: null }],
};

describe("publication rules", () => {
  it("accepts a complete book", () => expect(canPublish(complete).ok).toBe(true));
  it("requires a cover photo", () => expect(canPublish({ ...complete, coverUrl: null }).missing).toContain("cover"));
  it("requires at least one page", () => expect(canPublish({ ...complete, pages: [] }).ok).toBe(false));
  it("requires content for each layout", () => {
    expect(canPublish({ ...complete, pages: [{ layout: "photo+text", text: " ", imageUrl: null }] }).missing).toEqual(["text on page 1", "photo on page 1"]);
  });
  it("accepts coordinates at zero", () => expect(canPublish({ ...complete, pet: { ...complete.pet, lat: 0, lng: 0 } }).ok).toBe(true));
  it("refuses non-finite coordinates", () => expect(canPublish({ ...complete, pet: { ...complete.pet, lat: NaN } }).ok).toBe(false));
  it("rejects foreign photos", () => expect(ruleCheck({ ...complete, coverUrl: "https://example.com/photo.webp" }).decision).toBe("reject"));
  it("passes complete books to content moderation", () => expect(ruleCheck(complete).decision).toBe("approve"));
});

describe("book transitions", () => {
  it("requires review before publication", () => expect(() => transition("draft", "approve")).toThrow());
  it("sends submitted books into review", () => expect(transition("draft", "submit")).toBe("in_review"));
  it("allows human approval", () => expect(transition("needs_human", "approve")).toBe("published"));
  it("allows rejected books to be revised", () => expect(transition("rejected", "revise")).toBe("draft"));
  it("requires unpublishing before editing", () => expect(transition("published", "unpublish")).toBe("draft"));
  it("refuses resubmitting while waiting for review", () => expect(() => transition("needs_human", "submit")).toThrow());
});
