import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookView } from "./book-view";
import type { BookViewData } from "./types";

// A book alone on the page, closed, on a wash of its own cover color. Tap it to open it.
export function BookReader({ book, note }: { book: BookViewData; note?: string }) {
  return (
    <main
      data-cover={book.coverColor}
      className="flex flex-1 flex-col items-center justify-center gap-6 bg-[color-mix(in_oklab,var(--cover)_18%,var(--background))] px-4 py-10 sm:px-6"
    >
      {note && (
        <p className="rounded-full border bg-card/80 px-3 py-1 text-xs text-muted-foreground">{note}</p>
      )}
      {/* As wide as fits, but never taller than the screen: an open book is 3:2. */}
      <BookView book={book} className="max-w-[min(64rem,calc((100dvh-15rem)*1.5))]" />
      <p className="text-xs text-muted-foreground">Tap the book or use the arrow keys to turn the pages.</p>
    </main>
  );
}

export function BookNotAvailable() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <BookOpen className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="font-heading text-2xl font-semibold">This book is not available</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The link may be wrong, or the author stopped sharing it.
      </p>
      <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
        Go to Petbook
      </Button>
    </main>
  );
}
