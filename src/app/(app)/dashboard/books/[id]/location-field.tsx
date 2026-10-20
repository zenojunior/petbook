"use client";

import { Loader2, MapPin, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PetLocation = { city: string; lat: number; lng: number };

// Search for a city and pick one. Searching only runs on Enter or the button: Nominatim's
// usage policy does not allow search-as-you-type.
export function LocationField({
  value,
  onChange,
}: {
  value: PetLocation | null;
  onChange: (location: PetLocation | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PetLocation[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search() {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const response = await fetch(`/api/places?q=${encodeURIComponent(q)}`);
      const json = (await response.json()) as { places?: PetLocation[]; error?: string };
      if (response.ok && json.places) setResults(json.places);
      else setError(json.error ?? "City search failed.");
    } catch {
      setError("City search failed. Check your connection.");
    }
    setSearching(false);
  }

  function pick(place: PetLocation) {
    onChange(place);
    setQuery("");
    setResults(null);
  }

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-secondary/40 px-3 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{value.city}</span>
          </span>
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Remove city" onClick={() => onChange(null)}>
            <X />
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          id="city"
          value={query}
          placeholder={value ? "Search another city" : "Search for a city"}
          maxLength={100}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
        />
        <Button type="button" variant="outline" disabled={searching || query.trim().length < 2} onClick={search}>
          {searching ? <Loader2 className="animate-spin" /> : <Search />}
          <span className="sr-only">Search</span>
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {results && (
        <ul className="flex flex-col overflow-hidden rounded-lg border text-sm" aria-label="Cities found">
          {results.length === 0 && <li className="px-3 py-2 text-muted-foreground">No city found.</li>}
          {results.map((place) => (
            <li key={place.city} className="border-b last:border-b-0">
              <button
                type="button"
                className="w-full px-3 py-2 text-left outline-none hover:bg-muted focus-visible:bg-muted"
                onClick={() => pick(place)}
              >
                {place.city}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Only the city is kept, and the map shows an area around it, never an address.
      </p>
    </div>
  );
}
