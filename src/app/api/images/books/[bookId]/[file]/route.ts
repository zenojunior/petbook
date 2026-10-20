import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { books } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { readBookImage } from "@/lib/books/images";
import { canReadBookImages } from "@/lib/domain/book-access";

// Serves a book photo. Photos of a published book are public. Any other book's photos are
// visible to its owner and admins, and to whoever has the book's share link: the reader at
// /s/<token> adds ?k=<token> to the photo URLs.
export async function GET(request: Request, { params }: RouteContext<"/api/images/books/[bookId]/[file]">) {
  const { bookId, file } = await params;
  if (!z.uuid().safeParse(bookId).success) return notFound();

  const [book] = await db
    .select({ status: books.status, ownerId: books.ownerId, shareToken: books.shareToken, deletedAt: books.deletedAt })
    .from(books)
    .where(eq(books.id, bookId));
  if (!book) return notFound();

  const token = new URL(request.url).searchParams.get("k");
  // Active public/shared images need no session. A deleted book is admin-only,
  // including when its former owner or someone with an old token requests an image.
  if (!canReadBookImages(book, null, token)) {
    const user = await getCurrentUser();
    if (!canReadBookImages(book, user, token)) return notFound();
  }

  const image = await readBookImage(bookId, file);
  if (!image) return notFound();

  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/webp",
      "X-Content-Type-Options": "nosniff",
      // Recheck access on every request so deletion and unpublishing take effect immediately.
      "Cache-Control": "private, no-store",
    },
  });
}

function notFound() {
  return new Response("Not found", { status: 404 });
}
