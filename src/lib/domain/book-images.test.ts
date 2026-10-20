import { describe, expect, it } from "vitest";
import { bookImageUrl, fitWithin, isBookImageUrl, unusedImages } from "./book-images";

const bookId = "11111111-1111-4111-8111-111111111111";
const otherBookId = "22222222-2222-4222-8222-222222222222";
const fileA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.webp";
const fileB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp";

describe("isBookImageUrl", () => {
  it("accepts a photo stored in the same book", () => {
    expect(isBookImageUrl(bookImageUrl(bookId, fileA), bookId)).toBe(true);
  });

  it("refuses a photo from another book", () => {
    expect(isBookImageUrl(bookImageUrl(otherBookId, fileA), bookId)).toBe(false);
  });

  it("refuses outside URLs and path tricks", () => {
    expect(isBookImageUrl("https://example.com/cat.webp", bookId)).toBe(false);
    expect(isBookImageUrl(bookImageUrl(bookId, `../${otherBookId}/${fileA}`), bookId)).toBe(false);
  });
});

describe("fitWithin", () => {
  it("scales the longest side down to the limit", () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it("never scales a small image up", () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});

describe("unusedImages", () => {
  const now = new Date("2026-10-20T12:00:00Z");
  const old = new Date("2026-10-20T10:00:00Z");
  const hour = 60 * 60 * 1000;

  it("lists old files that no page uses", () => {
    const files = [
      { name: fileA, modifiedAt: old },
      { name: fileB, modifiedAt: old },
    ];
    expect(unusedImages(files, [bookImageUrl(bookId, fileA), null], bookId, now, hour)).toEqual([fileB]);
  });

  it("keeps a recent upload that is not saved in the book yet", () => {
    const files = [{ name: fileB, modifiedAt: new Date("2026-10-20T11:30:00Z") }];
    expect(unusedImages(files, [], bookId, now, hour)).toEqual([]);
  });

  it("ignores files it did not create", () => {
    expect(unusedImages([{ name: ".DS_Store", modifiedAt: old }], [], bookId, now, hour)).toEqual([]);
  });
});
