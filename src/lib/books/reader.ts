// Data reads for the reader: a published book by its slug, or any book by its share token.
// The access rules are in src/lib/domain/book-access.ts; these functions return null whenever a
// book must not be shown, so the page says "not available" without leaking anything.
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { books, pages, pets } from "@/db/schema";
import type { BookViewData } from "@/components/book/types";
import { opensByPublicLink, opensBySharedLink } from "@/lib/domain/book-access";

export type ReaderBook = {
  book: BookViewData;
  status: (typeof books.$inferSelect)["status"];
};

export async function getPublishedBook(slug: string): Promise<ReaderBook | null> {
  const row = await findBook(eq(books.slug, slug));
  if (!row || !opensByPublicLink(row.status)) return null;
  return row;
}

// Photos of a book that is not public are served only with the token (see the image route),
// so their URLs carry it.
export async function getSharedBook(token: string): Promise<ReaderBook | null> {
  const row = await findBook(eq(books.shareToken, token));
  if (!row || !opensBySharedLink(row.status)) return null;
  if (row.status === "published") return row;
  const withToken = (url: string | null) => (url ? `${url}?k=${encodeURIComponent(token)}` : null);
  return {
    ...row,
    book: {
      ...row.book,
      coverUrl: withToken(row.book.coverUrl),
      pages: row.book.pages.map((page) => ({ ...page, imageUrl: withToken(page.imageUrl) })),
    },
  };
}

async function findBook(where: ReturnType<typeof eq>): Promise<ReaderBook | null> {
  const [row] = await db
    .select({ book: books, pet: pets })
    .from(books)
    .innerJoin(pets, eq(books.petId, pets.id))
    .where(and(where, isNull(books.deletedAt)));
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
    .where(eq(pages.bookId, row.book.id))
    .orderBy(asc(pages.position));

  const { book, pet } = row;
  return {
    status: book.status,
    book: {
      title: book.title,
      coverUrl: book.coverUrl,
      coverColor: book.coverColor,
      coverPattern: book.coverPattern,
      pet: {
        name: pet.name,
        species: pet.species,
        bornOn: pet.bornOn,
        adoptedOn: pet.adoptedOn,
        passedOn: pet.passedOn,
        city: pet.city,
      },
      pages: bookPages,
    },
  };
}
