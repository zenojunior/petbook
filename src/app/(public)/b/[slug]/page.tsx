import type { Metadata } from "next";
import { Suspense } from "react";
import { BookNotAvailable, BookReader } from "@/components/book/book-reader";
import { getPublishedBook } from "@/lib/books/reader";

// A published book at its public address. Anything not published shows "not available".
export async function generateMetadata({ params }: PageProps<"/b/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublishedBook(slug);
  return { title: data ? data.book.title : "Book not available" };
}

export default function PublicBookPage({ params }: PageProps<"/b/[slug]">) {
  return (
    <Suspense fallback={null}>
      <PublicBook params={params} />
    </Suspense>
  );
}

async function PublicBook({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublishedBook(slug);
  if (!data) return <BookNotAvailable />;
  return <BookReader book={data.book} />;
}
