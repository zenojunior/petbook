import { describe, expect, it } from "vitest";
import { estimateCostUsd, inputTokenRate, readUsage } from "./audit";

describe("moderation cost accounting", () => {
  it("keeps fractional cents instead of rounding a small request to zero", () => {
    expect(estimateCostUsd(42, 0.1)).toBe("0.0000042000");
  });
  it("uses the historical rate passed by the caller", () => {
    expect(estimateCostUsd(1_000_000, 0.15)).toBe("0.1500000000");
  });
  it("distinguishes missing usage from a free request", () => {
    expect(readUsage({ answers: [] })).toBeNull();
    expect(readUsage({ usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 } })?.input_tokens).toBe(0);
  });
  it.each([-1, NaN, Infinity, 1.5])("rejects invalid token counts: %s", (tokens) => {
    expect(() => estimateCostUsd(tokens, 0.1)).toThrow();
  });
  it("does not accept malformed provider usage", () => {
    expect(readUsage({ usage: { input_tokens: -10, output_tokens: 0, total_tokens: -10 } })).toBeNull();
  });
  it("validates an overridden rate", () => {
    expect(inputTokenRate("0.12")).toBe(0.12);
    expect(() => inputTokenRate("invalid")).toThrow();
  });
});
