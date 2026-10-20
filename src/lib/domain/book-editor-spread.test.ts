import { describe, expect, it } from "vitest";
import { bookEditorSpread } from "./book-editor-spread";
import { buildSpreads, spreadIndexOfSide } from "./book-layout";

function editorAt(side: number, pageCount: number, perSpread: 1 | 2) {
  const spreads = buildSpreads(pageCount + 1, perSpread);
  return bookEditorSpread(spreads[spreadIndexOfSide(spreads, side)], pageCount);
}

describe("bookEditorSpread", () => {
  it("shows cover and pet fields on the closed cover", () => {
    expect(editorAt(0, 3, 2)).toEqual({ cover: true, pet: true, pageIndexes: [], end: false });
  });

  it("pairs pet details with the first content page in a wide book", () => {
    expect(editorAt(2, 3, 2)).toEqual({ cover: false, pet: true, pageIndexes: [0], end: false });
  });

  it("shows both visible content page editors", () => {
    expect(editorAt(3, 3, 2).pageIndexes).toEqual([1, 2]);
  });

  it("shows pet details alone in a narrow book", () => {
    expect(editorAt(1, 3, 1)).toEqual({ cover: false, pet: true, pageIndexes: [], end: false });
  });

  it("keeps a selected page when switching to one page per spread", () => {
    expect(editorAt(4, 3, 1)).toEqual({ cover: false, pet: false, pageIndexes: [2], end: false });
  });

  it("pairs a final content page with the end when needed", () => {
    expect(editorAt(3, 2, 2)).toEqual({ cover: false, pet: false, pageIndexes: [1], end: true });
  });

  it("lands on the end after deleting the selected last page", () => {
    expect(editorAt(8, 1, 1)).toEqual({ cover: false, pet: false, pageIndexes: [], end: true });
  });

  it("shows pet details and the end for an empty wide book", () => {
    expect(editorAt(1, 0, 2)).toEqual({ cover: false, pet: true, pageIndexes: [], end: true });
  });
});
