import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { books } from "@/db/schema";
import { bookUsage } from "@/lib/uploads";

// Stored photos are re-encoded to WebP at ~100–400 KB, so these are far above real use
// (a book has at most 100 pages plus a cover) and only stop someone filling the disk.
export const MAX_PHOTOS_PER_BOOK = 110;
export const MAX_BYTES_PER_USER = 500 * 1024 * 1024;

// Null when the book may take one more photo, otherwise the message to show.
export async function uploadQuotaError(userId: string, bookId: string): Promise<string | null> {
  const bookFiles = (await bookUsage(bookId)).files;
  if (bookFiles >= MAX_PHOTOS_PER_BOOK) return "This book has reached its photo limit.";

  const owned = await db.select({ id: books.id }).from(books).where(eq(books.ownerId, userId));
  let bytes = 0;
  for (const { id } of owned) bytes += (await bookUsage(id)).bytes;
  if (bytes >= MAX_BYTES_PER_USER) return "You have reached your storage limit. Remove unused photos or books first.";
  return null;
}
