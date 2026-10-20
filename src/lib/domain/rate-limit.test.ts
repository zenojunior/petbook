import { describe, expect, it } from "vitest";
import { takeRateLimit, type RateHits } from "./rate-limit";

const limit = { max: 2, windowMs: 60_000 };

describe("takeRateLimit", () => {
  it("allows attempts up to the maximum", () => {
    const hits: RateHits = new Map();
    expect(takeRateLimit(hits, "u1", limit, 0).ok).toBe(true);
    expect(takeRateLimit(hits, "u1", limit, 1000).ok).toBe(true);
  });

  it("refuses the attempt over the maximum and says when to retry", () => {
    const hits: RateHits = new Map();
    takeRateLimit(hits, "u1", limit, 0);
    takeRateLimit(hits, "u1", limit, 1000);
    const result = takeRateLimit(hits, "u1", limit, 10_000);
    expect(result).toEqual({ ok: false, retryAfterSeconds: 50 });
  });

  it("allows again once the oldest attempt leaves the window", () => {
    const hits: RateHits = new Map();
    takeRateLimit(hits, "u1", limit, 0);
    takeRateLimit(hits, "u1", limit, 1000);
    expect(takeRateLimit(hits, "u1", limit, 60_001).ok).toBe(true);
  });

  it("counts each key on its own", () => {
    const hits: RateHits = new Map();
    takeRateLimit(hits, "u1", limit, 0);
    takeRateLimit(hits, "u1", limit, 0);
    expect(takeRateLimit(hits, "u2", limit, 0).ok).toBe(true);
  });

  it("does not count refused attempts against the window", () => {
    const hits: RateHits = new Map();
    takeRateLimit(hits, "u1", limit, 0);
    takeRateLimit(hits, "u1", limit, 0);
    takeRateLimit(hits, "u1", limit, 30_000);
    expect(takeRateLimit(hits, "u1", limit, 60_001).ok).toBe(true);
  });
});
