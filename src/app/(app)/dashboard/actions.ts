"use server";

import { randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { books, pages, pets } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { deleteUnusedImages } from "@/lib/books/images";
import { bookInput, newBookInput, shareLinkInput, type BookInput } from "@/lib/books/input";
import { pickCoverColor } from "@/lib/domain/book-cover";
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
    const suffix = crypto.randomUUID().slice(0, 8);
    const [book] = await tx
      .insert(books)
      .values({
        petId: pet.id,
        ownerId: user.id,
        title,
        slug: makeSlug(title, suffix),
        coverColor: pickCoverColor(suffix),
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

  return db.transaction(async (tx) => {
    // Serialize with submission: a stale autosave must never modify reviewed content.
    const [book] = await tx
      .select({ id: books.id, petId: books.petId, status: books.status })
      .from(books)
      .where(and(eq(books.id, bookId), eq(books.ownerId, user.id), isNull(books.deletedAt)))
      .for("update");
    if (!book) return { ok: false, error: "Book not found." };
    if (book.status !== "draft") return { ok: false, error: "Only drafts can be edited." };

    const { title, coverUrl, coverColor, coverPattern, pet, pages: newPages } = parsed.data;
    const photos = [coverUrl, ...newPages.map((page) => page.imageUrl)];
    if (photos.some((url) => url !== null && !isBookImageUrl(url, book.id))) {
      return { ok: false, error: "A photo does not belong to this book." };
    }
    await tx.update(books).set({ title, coverUrl, coverColor, coverPattern }).where(eq(books.id, book.id));
    const { location, ...petDetails } = pet;
    const place = location
      ? { city: location.city, ...fuzzLocation(location) }
      : { city: null, lat: null, lng: null };
    await tx.update(pets).set({ ...petDetails, ...place }).where(eq(pets.id, book.petId));
    await tx.delete(pages).where(eq(pages.bookId, book.id));
    if (newPages.length > 0) {
      await tx.insert(pages).values(newPages.map((page, position) => ({ ...page, bookId: book.id, position })));
    }
    await deleteUnusedImages(book.id, photos);
    return { ok: true };
  });
}

export type ShareLinkResult = { ok: true; token: string | null } | { ok: false; error: string };

// Turns the "anyone with the link" share URL on or off. Turning it on reuses the current token;
// reset: true makes a new one, so links sent before stop working. Only the owner can do this.
export async function setShareLink(
  bookId: string,
  options: { enabled: boolean; reset?: boolean },
): Promise<ShareLinkResult> {
  const user = await requireUser(`/dashboard/books/${bookId}`);
  const parsed = shareLinkInput.safeParse({ bookId, ...options });
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const [book] = await db
    .select({ id: books.id, shareToken: books.shareToken })
    .from(books)
    .where(and(eq(books.id, parsed.data.bookId), eq(books.ownerId, user.id), isNull(books.deletedAt)));
  if (!book) return { ok: false, error: "Book not found." };

  const { enabled, reset } = parsed.data;
  const token = !enabled ? null : reset || !book.shareToken ? newShareToken() : book.shareToken;
  const [updated] = await db.update(books).set({ shareToken: token })
    .where(and(eq(books.id, book.id), eq(books.ownerId, user.id), isNull(books.deletedAt)))
    .returning({ id: books.id });
  if (!updated) return { ok: false, error: "Book not found." };
  return { ok: true, token };
}

// 24 random bytes: long enough that a share link cannot be guessed.
function newShareToken(): string {
  return randomBytes(24).toString("base64url");
}
