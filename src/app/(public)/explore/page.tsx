import { Suspense } from "react";
import type { Metadata } from "next";
import { BookMap } from "@/components/explore/book-map";
import { listPublishedBooks } from "@/lib/books/explore";

export const metadata: Metadata = { title: "Explore pet stories · Petbook", description: "Discover little books about pets from around the world. Pick a pin, meet an animal, and read their story." };

export default function ExplorePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="space-y-2"><h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">A world of pet stories</h1><p className="text-muted-foreground">Choose an animal, find a pin, and open their book. Every story here has been reviewed.</p></div>
      <Suspense fallback={<p role="status" className="flex min-h-96 items-center justify-center text-muted-foreground">Loading stories…</p>}><PublishedMap /></Suspense>
    </main>
  );
}

async function PublishedMap() {
  return <BookMap books={await listPublishedBooks()} />;
}
