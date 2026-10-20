"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption, NativeSelectOptGroup } from "@/components/ui/native-select";
import { speciesGroups } from "@/lib/domain/species";
import type { ExploreBook } from "@/lib/books/explore";

const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground" role="status">Loading map…</div> });

export function BookMap({ books, compact = false }: { books: ExploreBook[]; compact?: boolean }) {
  const [species, setSpecies] = useState("all");
  const visible = useMemo(() => books.filter((book) => species === "all" || book.species === species), [books, species]);
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor={compact ? "preview-species" : "map-species"}>Species</Label>
          <NativeSelect id={compact ? "preview-species" : "map-species"} value={species} onChange={(e) => setSpecies(e.target.value)}>
            <NativeSelectOption value="all">All animals</NativeSelectOption>
            {speciesGroups.map((group) => <NativeSelectOptGroup key={group.label} label={group.label}>{group.species.map((item) => <NativeSelectOption key={item.key} value={item.key}>{item.label}</NativeSelectOption>)}</NativeSelectOptGroup>)}
          </NativeSelect>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">{visible.length} {visible.length === 1 ? "book" : "books"}</p>
      </div>
      <div className={`relative isolate z-0 overflow-hidden rounded-2xl border bg-secondary ${compact ? "h-[360px]" : "h-[min(68dvh,720px)] min-h-96"}`} aria-label="Map of published pet books">
        <LeafletMap books={visible} />
        {visible.length === 0 && <div className="pointer-events-none absolute inset-x-12 top-4 z-[1000] mx-auto max-w-sm rounded-xl border bg-background/95 p-4 text-center text-sm shadow-sm" role="status">{books.length === 0 ? "The first stories are on their way. Published books will appear here." : "No published books for this species yet. Try another animal."}</div>}
      </div>
      <p className="text-xs text-muted-foreground">Locations are approximate. Choose a pin to see its book; choose a group to explore nearby stories.</p>
      {!compact && visible.length > 0 && <details className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer">Browse books as a list</summary><ul className="mt-3 grid gap-2 sm:grid-cols-2">{visible.map((book) => <li key={book.id}><Link href={`/b/${book.slug}`} className="underline underline-offset-4">{book.title}</Link><span className="text-muted-foreground"> · {book.city}</span></li>)}</ul></details>}
    </div>
  );
}
