// Moves one page to a new position and returns a new array; the input is left untouched.
// Positions are the array order, so the result is always contiguous (0..n-1).
// An out-of-range index returns the pages unchanged instead of throwing: a stale click
// in the editor should do nothing, not crash it.
export function movePage<T>(pages: readonly T[], from: number, to: number): T[] {
  const inRange = (i: number) => Number.isInteger(i) && i >= 0 && i < pages.length;
  if (!inRange(from) || !inRange(to) || from === to) return [...pages];
  const next = [...pages];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
