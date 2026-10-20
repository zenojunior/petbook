// Rules for the photos of a book. Files live in the book's own folder and are named by a
// random uuid, so a URL can be checked against the book it claims to belong to.

// Longest side of a stored photo. Enough for a full page on a large screen.
export const IMAGE_MAX_EDGE = 1600;

const FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export function isImageFileName(name: string): boolean {
  return FILE_NAME.test(name);
}

export function bookImageUrl(bookId: string, fileName: string): string {
  return `/api/images/books/${bookId}/${fileName}`;
}

// True only for a photo stored in this book's folder. Stops a page from pointing at another
// book's photo (which could be a draft) or at an outside URL.
export function isBookImageUrl(url: string, bookId: string): boolean {
  const prefix = bookImageUrl(bookId, "");
  return url.startsWith(prefix) && isImageFileName(url.slice(prefix.length));
}

// Scales a size down so its longest side is at most maxEdge, keeping the proportions.
// Never scales up.
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

// Files in a book's folder that no page or cover uses anymore. Recent files are kept even if
// unused: a photo that was just uploaded may not be saved in the book yet.
export function unusedImages(
  files: { name: string; modifiedAt: Date }[],
  usedUrls: (string | null)[],
  bookId: string,
  now: Date,
  graceMs: number,
): string[] {
  const used = new Set(usedUrls);
  return files
    .filter((file) => isImageFileName(file.name))
    .filter((file) => !used.has(bookImageUrl(bookId, file.name)))
    .filter((file) => now.getTime() - file.modifiedAt.getTime() > graceMs)
    .map((file) => file.name);
}
