// Data reads for the author's own books. Every read filters by the signed-in owner, so a
// guessed book id from someone else returns nothing (drafts never leak).
import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { books, pages, pets } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function listMyBooks() {
  const user = await requireUser("/dashboard");
  return db
    .select({
      id: books.id,
      title: books.title,
      status: books.status,
      coverColor: books.coverColor,
      coverPattern: books.coverPattern,
      updatedAt: books.updatedAt,
      petName: pets.name,
      species: pets.species,
      pageCount: count(pages.id),
    })
    .from(books)
    .innerJoin(pets, eq(books.petId, pets.id))
    .leftJoin(pages, eq(pages.bookId, books.id))
    .where(eq(books.ownerId, user.id))
    .groupBy(books.id, pets.id)
    .orderBy(desc(books.updatedAt));
}

export async function getMyBook(bookId: string) {
  const user = await requireUser(`/dashboard/books/${bookId}`);
  const [row] = await db
    .select({ book: books, pet: pets })
    .from(books)
    .innerJoin(pets, eq(books.petId, pets.id))
    .where(and(eq(books.id, bookId), eq(books.ownerId, user.id)));
  if (!row) return null;

  const bookPages = await db
    .select({
      id: pages.id,
      layout: pages.layout,
      text: pages.text,
      imageUrl: pages.imageUrl,
      caption: pages.caption,
    })
    .from(pages)
    .where(eq(pages.bookId, bookId))
    .orderBy(asc(pages.position));

  return { ...row, pages: bookPages };
}
