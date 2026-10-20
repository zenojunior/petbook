import type { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";
import { BookNotAvailable, BookReader } from "@/components/book/book-reader";
import { getSharedBook } from "@/lib/books/reader";
import { ReaderSkeleton } from "@/components/skeletons";

// A book opened through its secret share link. It may be a draft that was never reviewed, so
// the page stays out of search engines and does not send the link to other sites.
export const metadata: Metadata = {
  title: "A Petbook",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// newShareToken() makes 32 base64url characters.
const shareToken = z.string().regex(/^[A-Za-z0-9_-]{32}$/);

export default function SharedBookPage({ params }: PageProps<"/s/[token]">) {
  return (
    <Suspense fallback={<ReaderSkeleton />}>
      <SharedBook params={params} />
    </Suspense>
  );
}

async function SharedBook({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!shareToken.safeParse(token).success) return <BookNotAvailable />;

  const data = await getSharedBook(token);
  if (!data) return <BookNotAvailable />;

  const note = data.status === "published" ? undefined : "Shared by link · not published yet";
  return <BookReader book={data.book} note={note} />;
}
