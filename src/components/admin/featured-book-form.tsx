"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setFeaturedBook } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RANDOM = "random";

export function FeaturedBookForm({
  books,
  pinnedId,
}: {
  books: { id: string; title: string; petName: string; city: string | null }[];
  pinnedId: string | null;
}) {
  const [value, setValue] = useState(pinnedId && books.some((book) => book.id === pinnedId) ? pinnedId : RANDOM);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  // `items` lets the trigger show the label of the chosen value, not its id.
  const items = [
    { value: RANDOM, label: "A random published book on every visit" },
    ...books.map((book) => ({
      value: book.id,
      label: `${book.petName}${book.city ? ` (${book.city})` : ""} · ${book.title}`,
    })),
  ];

  function save() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await setFeaturedBook(value === RANDOM ? null : value);
        setMessage(result.ok ? { ok: true, text: "Saved." } : { ok: false, text: result.error });
        if (result.ok) router.refresh();
      } catch {
        setMessage({ ok: false, text: "Could not save. Refresh and try again." });
      }
    });
  }

  return (
    <section className="flex max-w-xl flex-col gap-3 rounded-xl border p-4">
      <Label htmlFor="featured-book">Landing page book</Label>
      <Select items={items} value={value} onValueChange={(next) => next && setValue(next)} disabled={pending}>
        <SelectTrigger id="featured-book" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending}>Save</Button>
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
