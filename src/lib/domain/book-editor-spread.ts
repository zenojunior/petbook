// BookView sides: cover = 0, pet details = 1, content page index + 2, end = pageCount + 2.
export function bookEditorSpread(sides: readonly number[], pageCount: number) {
  return {
    cover: sides.includes(0),
    pet: sides.includes(0) || sides.includes(1),
    pageIndexes: sides.filter((side) => side >= 2 && side < pageCount + 2).map((side) => side - 2),
    end: sides.includes(pageCount + 2),
  };
}
