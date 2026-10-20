import { describe, expect, it } from "vitest";
import { fuzzLocation } from "./fuzz-location";

describe("fuzzLocation", () => {
  it("snaps coordinates to a 0.02 degree grid", () => {
    expect(fuzzLocation({ lat: -22.9056391, lng: -47.059564 })).toEqual({ lat: -22.9, lng: -47.06 });
  });

  it("gives the same point for two homes in the same area", () => {
    const a = fuzzLocation({ lat: 38.7223, lng: -9.1393 });
    const b = fuzzLocation({ lat: 38.7189, lng: -9.1421 });
    expect(a).toEqual(b);
  });

  it("keeps coordinates inside the valid range", () => {
    expect(fuzzLocation({ lat: 89.999, lng: 181 })).toEqual({ lat: 90, lng: -179 });
  });
});
