// A sliding-window rate limiter. The caller owns the hits map and passes the clock in, so the
// rule stays pure. The app runs as a single container, so a map in memory is enough; with more
// than one instance each would count on its own.

export type RateLimit = { max: number; windowMs: number };
export type RateHits = Map<string, number[]>;

// Records one attempt for the key and says whether it is allowed. Refused attempts are not recorded.
export function takeRateLimit(
  hits: RateHits,
  key: string,
  limit: RateLimit,
  now: number,
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const recent = (hits.get(key) ?? []).filter((at) => now - at < limit.windowMs);
  if (recent.length >= limit.max) {
    hits.set(key, recent);
    return { ok: false, retryAfterSeconds: Math.ceil((recent[0] + limit.windowMs - now) / 1000) };
  }
  hits.set(key, [...recent, now]);
  return { ok: true };
}
