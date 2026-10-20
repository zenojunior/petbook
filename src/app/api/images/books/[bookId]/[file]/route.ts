import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { books } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { readBookImage } from "@/lib/books/images";

// Serves a book photo. Photos of a published book are public; any other book's photos are
// visible only to its owner and admins, like the book itself (drafts never leak).
export async function GET(_request: Request, { params }: RouteContext<"/api/images/books/[bookId]/[file]">) {
  const { bookId, file } = await params;
  if (!z.uuid().safeParse(bookId).success) return notFound();

  const [book] = await db
    .select({ status: books.status, ownerId: books.ownerId })
    .from(books)
    .where(eq(books.id, bookId));
  if (!book) return notFound();

  const isPublic = book.status === "published";
  if (!isPublic) {
    const user = await getCurrentUser();
    if (!user || (user.id !== book.ownerId && user.role !== "admin")) return notFound();
  }

  const image = await readBookImage(bookId, file);
  if (!image) return notFound();

  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/webp",
      "X-Content-Type-Options": "nosniff",
      // A day, not forever: a book can be unpublished. Photos of a book that is not public
      // must not end up in a shared cache.
      "Cache-Control": isPublic ? "public, max-age=86400" : "private, max-age=3600",
    },
  });
}

function notFound() {
  return new Response("Not found", { status: 404 });
}
