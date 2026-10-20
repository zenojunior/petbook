"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { books, pages, pets } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { deleteUnusedImages } from "@/lib/books/images";
import { bookInput, newBookInput, type BookInput } from "@/lib/books/input";
import { isBookImageUrl } from "@/lib/domain/book-images";
import { fuzzLocation } from "@/lib/domain/fuzz-location";
import { makeSlug } from "@/lib/domain/make-slug";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Creates the pet and an empty draft book, then opens the editor.
export async function createBook(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser("/dashboard");
  const parsed = newBookInput.safeParse({
    petName: formData.get("petName"),
    species: formData.get("species"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { petName, species } = parsed.data;
  const bookId = await db.transaction(async (tx) => {
    const [pet] = await tx
      .insert(pets)
      .values({ ownerId: user.id, name: petName, species })
      .returning({ id: pets.id });
    const title = `The book of ${petName}`;
    const [book] = await tx
      .insert(books)
      .values({
        petId: pet.id,
        ownerId: user.id,
        title,
        slug: makeSlug(title, crypto.randomUUID().slice(0, 8)),
      })
      .returning({ id: books.id });
    return book.id;
  });

  redirect(`/dashboard/books/${bookId}`);
}

// Saves the whole book from the editor: details, pet and the ordered pages.
// Only the owner can save, and only while the book is a draft.
export async function saveBook(bookId: string, input: BookInput): Promise<ActionResult> {
  const user = await requireUser(`/dashboard/books/${bookId}`);
  const parsed = bookInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const [book] = await db
    .select({ id: books.id, petId: books.petId, status: books.status })
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.ownerId, user.id)));
  if (!book) return { ok: false, error: "Book not found." };
  if (book.status !== "draft") return { ok: false, error: "Only drafts can be edited." };

  const { title, coverUrl, pet, pages: newPages } = parsed.data;
  const photos = [coverUrl, ...newPages.map((page) => page.imageUrl)];
  if (photos.some((url) => url !== null && !isBookImageUrl(url, book.id))) {
    return { ok: false, error: "A photo does not belong to this book." };
  }

  await db.transaction(async (tx) => {
    await tx.update(books).set({ title, coverUrl }).where(eq(books.id, book.id));
    const { location, ...petDetails } = pet;
    const place = location
      ? { city: location.city, ...fuzzLocation(location) }
      : { city: null, lat: null, lng: null };
    await tx.update(pets).set({ ...petDetails, ...place }).where(eq(pets.id, book.petId));
    // Pages are replaced as a whole: the array order becomes the position.
    await tx.delete(pages).where(eq(pages.bookId, book.id));
    if (newPages.length > 0) {
      await tx
        .insert(pages)
        .values(newPages.map((page, position) => ({ ...page, bookId: book.id, position })));
    }
  });

  // Replaced or removed photos are not needed anymore.
  await deleteUnusedImages(book.id, photos);
  return { ok: true };
}
