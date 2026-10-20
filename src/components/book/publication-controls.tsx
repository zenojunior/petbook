"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { returnToDraft, submitForReview } from "@/app/(app)/dashboard/publication-actions";
import { Button } from "@/components/ui/button";
import type { BookStatus } from "@/lib/domain/transition";

export function PublicationControls({ bookId, status, saved, reasons, onBusyChange }: { bookId: string; status: BookStatus; saved: boolean; reasons: string[]; onBusyChange: (busy: boolean) => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  function run(submit: boolean) {
    setError(null);
    onBusyChange(true);
    startTransition(async () => {
      try {
        const result = await (submit ? submitForReview(bookId) : returnToDraft(bookId));
        if (!result.ok) setError(result.error);
        else router.refresh();
      } catch {
        setError("The request could not complete. Refresh to check the book's status before trying again.");
      } finally {
        onBusyChange(false);
      }
    });
  }
  return (
    <section aria-label="Publication" className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground" role="status">
          {pending ? "Please wait while we check your book…" : status === "draft" ? "Ready for the map? Submit your saved book for review. The text and photos will be checked by OpenAI before publication." : status === "published" ? "Your book is public and appears on the map. Unpublish it to edit again." : status === "rejected" ? "Your book needs changes before it can be published." : "Your book is waiting for review. You can follow its status here."}
        </p>
        {status === "draft" && <Button disabled={pending || !saved} onClick={() => run(true)}>{pending ? "Reviewing…" : saved ? "Submit for review" : "Save changes before submitting"}</Button>}
        {(status === "published" || status === "rejected") && <Button variant="outline" disabled={pending} onClick={() => run(false)}>{status === "published" ? "Unpublish and edit" : "Return to draft"}</Button>}
      </div>
      {status !== "draft" && reasons.length > 0 && <ul className="list-disc pl-5 text-sm text-muted-foreground">{reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
