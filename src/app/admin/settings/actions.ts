"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { books, siteSettings } from "@/db/schema";
import type { ActionResult } from "@/app/(app)/dashboard/actions";
import { requireAdmin } from "@/lib/auth";
import { FEATURED_BOOK_KEY, FEATURED_TAG } from "@/lib/books/featured";

// Pins a published book on the landing page, or (bookId = null) goes back to a random one.
export async function setFeaturedBook(bookId: string | null): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.uuid().nullable().safeParse(bookId);
  if (!parsed.success) return { ok: false, error: "Invalid book." };

  if (parsed.data === null) {
    await db.delete(siteSettings).where(eq(siteSettings.key, FEATURED_BOOK_KEY));
  } else {
    const [book] = await db
      .select({ id: books.id })
      .from(books)
      .where(and(eq(books.id, parsed.data), eq(books.status, "published"), isNull(books.deletedAt)));
    if (!book) return { ok: false, error: "Only published books can be featured." };
    await db
      .insert(siteSettings)
      .values({ key: FEATURED_BOOK_KEY, value: book.id })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value: book.id, updatedAt: new Date() } });
  }
  updateTag(FEATURED_TAG);
  revalidatePath("/admin/settings");
  return { ok: true };
}
