import { describe, expect, it } from "vitest";
import { buildSpreads, petDatesLine, spreadIndexOfSide } from "./book-layout";

const noDates = { bornOn: null, adoptedOn: null, passedOn: null };

describe("petDatesLine", () => {
  it("shows the years of a pet that passed", () => {
    expect(petDatesLine({ ...noDates, bornOn: "2012-03-01", passedOn: "2024-11-20" })).toBe(
      "2012 – 2024",
    );
  });

  it("starts at the adoption when the birth is unknown", () => {
    expect(petDatesLine({ ...noDates, adoptedOn: "2015-06-10", passedOn: "2024-01-02" })).toBe(
      "2015 – 2024",
    );
  });

  it("shows a single year when the pet was born and passed the same year", () => {
    expect(petDatesLine({ ...noDates, bornOn: "2020-01-01", passedOn: "2020-12-01" })).toBe("2020");
  });

  it("shows only the end when the start is unknown", () => {
    expect(petDatesLine({ ...noDates, passedOn: "2024-05-05" })).toBe("until 2024");
  });

  it("counts a living pet from its adoption", () => {
    expect(petDatesLine({ ...noDates, bornOn: "2017-02-02", adoptedOn: "2019-08-01" })).toBe(
      "since 2019",
    );
  });

  it("falls back to the birth year for a living pet", () => {
    expect(petDatesLine({ ...noDates, bornOn: "2019-08-01" })).toBe("born 2019");
  });

  it("returns null when there are no usable dates", () => {
    expect(petDatesLine(noDates)).toBeNull();
    expect(petDatesLine({ ...noDates, bornOn: "" })).toBeNull();
  });
});

describe("buildSpreads", () => {
  it("pairs the pages and the end after a cover that stands alone", () => {
    expect(buildSpreads(3, 2)).toEqual([[0], [1, 2], [3, 4]]);
  });

  it("leaves the end alone when the pages fill every spread", () => {
    expect(buildSpreads(2, 2)).toEqual([[0], [1, 2], [3]]);
  });

  it("shows one side per spread on narrow screens", () => {
    expect(buildSpreads(2, 1)).toEqual([[0], [1], [2], [3]]);
  });

  it("still has a cover and an end for a book with no pages", () => {
    expect(buildSpreads(0, 2)).toEqual([[0], [1]]);
  });
});

describe("spreadIndexOfSide", () => {
  const spreads = buildSpreads(3, 2);

  it("finds the spread that shows a page", () => {
    expect(spreadIndexOfSide(spreads, 3)).toBe(2);
  });

  it("lands on the last spread when the side no longer exists", () => {
    expect(spreadIndexOfSide(spreads, 9)).toBe(2);
  });
});
