import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { books } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { InvalidImageError, MAX_UPLOAD_BYTES, storeBookImage } from "@/lib/books/images";

// Uploads one photo for a book. Only the owner, and only while the book is a draft.
// Responds with the URL to put on a page or as the cover; saving the book is a separate step.
export async function POST(request: Request, { params }: RouteContext<"/api/books/[id]/images">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to upload photos." }, { status: 401 });

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return notFound();
  const [book] = await db
    .select({ id: books.id, status: books.status })
    .from(books)
    .where(and(eq(books.id, id), eq(books.ownerId, user.id), isNull(books.deletedAt)));
  if (!book) return notFound();
  if (book.status !== "draft") {
    return NextResponse.json({ error: "Only drafts can be edited." }, { status: 409 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo was sent." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "This photo is too large (15 MB max)." }, { status: 413 });
  }

  try {
    const url = await storeBookImage(book.id, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidImageError) {
      return NextResponse.json({ error: error.message }, { status: 415 });
    }
    throw error;
  }
}

function notFound() {
  return NextResponse.json({ error: "Book not found." }, { status: 404 });
}
