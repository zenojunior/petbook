import { describe, expect, it } from "vitest";
import { speciesLabel, toSpecies } from "./species";

describe("toSpecies", () => {
  it("matches old free text by label, ignoring case and spaces", () => {
    expect(toSpecies(" Cat ")).toBe("cat");
    expect(toSpecies("guinea pig")).toBe("guinea-pig");
  });

  it("keeps a value that is already a key", () => {
    expect(toSpecies("guinea-pig")).toBe("guinea-pig");
  });

  it("turns anything unknown into other", () => {
    expect(toSpecies("axolotl")).toBe("other");
  });
});

describe("speciesLabel", () => {
  it("gives the readable name of a key", () => {
    expect(speciesLabel("guinea-pig")).toBe("Guinea pig");
  });

  it("falls back to a generic name for an unknown key", () => {
    expect(speciesLabel("unicorn")).toBe("Other animal");
  });
});
