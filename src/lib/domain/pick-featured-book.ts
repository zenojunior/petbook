// Which book the landing page shows. The admin can pin one; while none is pinned, or the pinned
// one is no longer published, every visit gets a random published book.
// `random` returns a number in [0, 1), like Math.random, so tests can choose the outcome.

export function pickFeaturedBook<T extends { id: string }>(
  published: T[],
  pinnedId: string | null,
  random: () => number,
): T | null {
  if (published.length === 0) return null;
  const pinned = pinnedId ? published.find((book) => book.id === pinnedId) : undefined;
  if (pinned) return pinned;
  return published[Math.min(Math.floor(random() * published.length), published.length - 1)];
}
