// How a book is laid out for reading: the line of dates under the pet's name and the
// grouping of sides into spreads. Pure, so the reader and the editor preview agree.

type PetDates = {
  // ISO dates (YYYY-MM-DD) or null.
  bornOn: string | null;
  adoptedOn: string | null;
  passedOn: string | null;
};

function yearOf(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const match = /^(\d{4})/.exec(isoDate);
  return match ? match[1] : null;
}

// "2012 – 2024" for a pet that passed, "since 2019" for one still with us (counted from the
// adoption when known), "born 2019" when only the birth is known, null when there is nothing.
export function petDatesLine(pet: PetDates): string | null {
  const born = yearOf(pet.bornOn);
  const adopted = yearOf(pet.adoptedOn);
  const passed = yearOf(pet.passedOn);

  if (passed) {
    const start = born ?? adopted;
    if (!start) return `until ${passed}`;
    if (start === passed) return passed;
    return `${start} – ${passed}`;
  }
  if (adopted) return `since ${adopted}`;
  if (born) return `born ${born}`;
  return null;
}

// A book is a list of sides: 0 is the cover, 1..pageCount are the pages (side = page index + 1)
// and pageCount + 1 is "The end". The cover is always alone; the rest is grouped by `perSpread`
// (2 for an open book, 1 on narrow screens). Returns the side numbers of each spread.
export function buildSpreads(pageCount: number, perSpread: 1 | 2): number[][] {
  const spreads: number[][] = [[0]];
  const lastSide = pageCount + 1;
  for (let side = 1; side <= lastSide; side += perSpread) {
    const spread = [side];
    if (perSpread === 2 && side + 1 <= lastSide) spread.push(side + 1);
    spreads.push(spread);
  }
  return spreads;
}

// The spread that shows `side`. A side past the end (pages were deleted) lands on the last spread.
export function spreadIndexOfSide(spreads: number[][], side: number): number {
  const index = spreads.findIndex((spread) => spread.includes(side));
  if (index !== -1) return index;
  return side <= 0 ? 0 : spreads.length - 1;
}
