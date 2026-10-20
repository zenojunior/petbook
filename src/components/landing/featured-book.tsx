import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { BookPreview } from "@/components/landing/book-preview";
import { BookView } from "@/components/book/book-view";
import { getFeaturedBook } from "@/lib/books/featured";

// A real published book in the hero, drawn like the reader draws it: its own cover color and
// pattern, closed. Tapping it opens it and the visitor can turn its pages right here.
// It is the pinned book (admin > Settings), or a random one on every visit. With no published
// book yet it shows the drawn sample, so the page is never empty.
export async function FeaturedBook() {
  // A different book per visit: this must run at request time, not at build time.
  await connection();
  const featured = await getFeaturedBook();
  if (!featured) return <BookPreview />;

  const { book, slug } = featured;
  return (
    <div
      data-cover={book.coverColor}
      className="flex min-w-0 animate-in flex-col items-center gap-4 rounded-3xl duration-500 fade-in bg-[color-mix(in_oklab,var(--cover)_22%,var(--background))] p-4 sm:p-8"
    >
      <BookView book={book} className="max-w-[40rem]" />
      <div className="flex w-full max-w-[40rem] flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <p className="text-muted-foreground">Tap the book to open it.</p>
        <Link href={`/b/${slug}`} className="inline-flex items-center gap-1 font-medium hover:underline">
          Read the story of {book.pet.name} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
