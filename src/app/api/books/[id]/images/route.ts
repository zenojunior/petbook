import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { books } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { InvalidImageError, MAX_UPLOAD_BYTES, storeBookImage } from "@/lib/books/images";
import { uploadQuotaError } from "@/lib/books/upload-quota";
import { checkRateLimit } from "@/lib/rate-limit";

// Room for the multipart boundaries and field headers around the file.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

// Uploads one photo for a book. Only the owner, and only while the book is a draft.
// Responds with the URL to put on a page or as the cover; saving the book is a separate step.
export async function POST(request: Request, { params }: RouteContext<"/api/books/[id]/images">) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to upload photos." }, { status: 401 });

  const limited = checkRateLimit("upload", user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  // Refuse by declared size before the body is read: formData() buffers the whole upload in memory.
  const declared = Number(request.headers.get("content-length"));
  if (!Number.isFinite(declared) || declared <= 0) {
    return NextResponse.json({ error: "Upload size is missing." }, { status: 411 });
  }
  if (declared > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD_BYTES) {
    return NextResponse.json({ error: "This photo is too large (15 MB max)." }, { status: 413 });
  }

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

  const quotaError = await uploadQuotaError(user.id, book.id);
  if (quotaError) return NextResponse.json({ error: quotaError }, { status: 413 });

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
