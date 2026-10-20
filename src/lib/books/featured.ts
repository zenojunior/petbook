import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { books, pets, siteSettings } from "@/db/schema";
import { getPublishedBook } from "@/lib/books/reader";
import { pickFeaturedBook } from "@/lib/domain/pick-featured-book";

export const FEATURED_BOOK_KEY = "featured_book_id";

// Cache tag for everything the landing page reads. The visit picks a random book from cached data,
// so the page does not wait on the database. Actions that publish, unpublish or delete a book, or
// change the pinned one, expire this tag; the short lifetime is only a safety net.
export const FEATURED_TAG = "featured-book";

// Published books only; a deleted or unpublished book can never be featured.
export async function listFeaturableBooks() {
  "use cache";
  cacheTag(FEATURED_TAG);
  cacheLife("minutes");
  return db
    .select({ id: books.id, slug: books.slug, title: books.title, petName: pets.name, city: pets.city })
    .from(books)
    .innerJoin(pets, eq(books.petId, pets.id))
    .where(and(eq(books.status, "published"), isNull(books.deletedAt)))
    .orderBy(asc(pets.name));
}

export async function getPinnedBookId(): Promise<string | null> {
  "use cache";
  cacheTag(FEATURED_TAG);
  cacheLife("minutes");
  try {
    const [row] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, FEATURED_BOOK_KEY));
    return row?.value ?? null;
  } catch (error) {
    // The landing page must not break because of a cosmetic setting (for example while the
    // migration that creates site_settings is not applied yet): fall back to a random book.
    console.error("Could not read the featured book setting", error);
    return null;
  }
}

// The book shown on the landing page, with everything the reader needs to draw it (cover, color,
// pages), so a visitor can open and turn it right there. Published books only.
async function getCachedPublishedBook(slug: string) {
  "use cache";
  cacheTag(FEATURED_TAG);
  cacheLife("minutes");
  return getPublishedBook(slug);
}

export async function getFeaturedBook() {
  const [published, pinnedId] = await Promise.all([listFeaturableBooks(), getPinnedBookId()]);
  const picked = pickFeaturedBook(published, pinnedId, Math.random);
  if (!picked) return null;
  const reader = await getCachedPublishedBook(picked.slug);
  return reader ? { slug: picked.slug, book: reader.book } : null;
}
