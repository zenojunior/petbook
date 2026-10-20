import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { books } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { readBookImage } from "@/lib/books/images";
import { opensBySharedLink } from "@/lib/domain/book-access";

// Serves a book photo. Photos of a published book are public. Any other book's photos are
// visible to its owner and admins, and to whoever has the book's share link: the reader at
// /s/<token> adds ?k=<token> to the photo URLs.
export async function GET(request: Request, { params }: RouteContext<"/api/images/books/[bookId]/[file]">) {
  const { bookId, file } = await params;
  if (!z.uuid().safeParse(bookId).success) return notFound();

  const [book] = await db
    .select({ status: books.status, ownerId: books.ownerId, shareToken: books.shareToken })
    .from(books)
    .where(eq(books.id, bookId));
  if (!book) return notFound();

  const isPublic = book.status === "published";
  const token = new URL(request.url).searchParams.get("k");
  const hasSharedLink =
    token !== null && book.shareToken === token && opensBySharedLink(book.status);
  if (!isPublic && !hasSharedLink) {
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
