import "server-only";
import { takeRateLimit, type RateHits, type RateLimit } from "@/lib/domain/rate-limit";

// Per-action limits, by signed-in user. Photos are the heaviest (decode + re-encode),
// submissions cost an LLM call, and place search hits Nominatim, which allows ~1 request/second.
export const LIMITS = {
  upload: { max: 30, windowMs: 10 * 60 * 1000 },
  submit: { max: 5, windowMs: 60 * 60 * 1000 },
  places: { max: 60, windowMs: 60 * 1000 },
} satisfies Record<string, RateLimit>;

const hits: RateHits = new Map();

export function checkRateLimit(action: keyof typeof LIMITS, userId: string) {
  return takeRateLimit(hits, `${action}:${userId}`, LIMITS[action], Date.now());
}
