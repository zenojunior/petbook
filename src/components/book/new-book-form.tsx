"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { createBook } from "@/app/(app)/dashboard/actions";
import { SpeciesSelect } from "@/components/book/species-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Two questions and the author is in the editor: everything else can be filled in there.
export function NewBookForm() {
  const [state, formAction, pending] = useActionState(createBook, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="petName">Your pet&apos;s name</Label>
          <Input id="petName" name="petName" placeholder="Thor" required maxLength={80} autoFocus />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="species">What kind of animal?</Label>
          <SpeciesSelect id="species" name="species" defaultValue="" required />
        </div>
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Creating…" : "Start writing"}
        <ArrowRight data-icon="inline-end" />
      </Button>
    </form>
  );
}
