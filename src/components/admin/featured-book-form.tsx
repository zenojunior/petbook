"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { searchBooksToFeature, setFeaturedBook } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FeaturableBook } from "@/lib/books/featured";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function describe(book: FeaturableBook) {
  return `${book.petName}${book.city ? ` (${book.city})` : ""} · ${book.title}`;
}

export function FeaturedBookForm({ pinned }: { pinned: FeaturableBook | null }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FeaturableBook[]>([]);
  const [searching, setSearching] = useState(false);
  const [chosen, setChosen] = useState<FeaturableBook | null>(pinned);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Search as the admin types. Paste a book id to find that exact book.
  useEffect(() => {
    const text = query.trim();
    // Shorter than that nothing is listed (see the render below), so there is nothing to fetch.
    if (text.length < 2) return;
    let current = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchBooksToFeature(text);
        if (!current) return;
        setResults(found);
        if (UUID.test(text) && found.length === 1) setChosen(found[0]);
      } catch {
        if (current) setResults([]);
      } finally {
        if (current) setSearching(false);
      }
    }, 300);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query]);

  function save(bookId: string | null) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await setFeaturedBook(bookId);
        if (!result.ok) return setMessage({ ok: false, text: result.error });
        if (bookId === null) setChosen(null);
        setMessage({ ok: true, text: bookId ? "Saved. This book is now on the landing page." : "Saved. The landing page shows a random book again." });
        router.refresh();
      } catch {
        setMessage({ ok: false, text: "Could not save. Refresh and try again." });
      }
    });
  }

  const isPinned = chosen !== null && chosen.id === pinned?.id;
  return (
    <section className="flex max-w-xl flex-col gap-4 rounded-xl border p-4">
      <div className="flex flex-col gap-1">
        <Label>Landing page book</Label>
        <p className="text-sm text-muted-foreground">
          {pinned ? <>Pinned now: <strong className="font-medium text-foreground">{describe(pinned)}</strong></> : "None pinned: each visit shows a random published book."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="featured-book-search">Book id, title, pet name or city</Label>
        <Input
          id="featured-book-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Paste a book id, or type a name to search"
          autoComplete="off"
          spellCheck={false}
          disabled={pending}
        />
        {query.trim().length >= 2 && (
          <ul className="flex flex-col divide-y rounded-lg border" aria-label="Matching published books">
            {results.map((book) => (
              <li key={book.id}>
                <button
                  type="button"
                  onClick={() => setChosen(book)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                >
                  <span>{describe(book)}</span>
                  <span className="font-mono text-xs text-muted-foreground">{book.id}</span>
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">{searching ? "Searching…" : "No published book matches."}</li>
            )}
          </ul>
        )}
      </div>

      {chosen && !isPinned && (
        <p className="text-sm">Selected: <strong className="font-medium">{describe(chosen)}</strong></p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => chosen && save(chosen.id)} disabled={pending || !chosen || isPinned}>Pin this book</Button>
        <Button variant="outline" onClick={() => save(null)} disabled={pending || !pinned}>Use a random book</Button>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
