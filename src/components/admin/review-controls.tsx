"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reviewBook } from "@/app/(app)/dashboard/publication-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReviewControls({ bookId }: { bookId: string }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function decide(decision: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      try {
        const result = await reviewBook(bookId, { decision, reason });
        if (!result.ok) setError(result.error);
        else router.refresh();
      } catch { setError("Could not save the decision. Refresh and try again."); }
    });
  }
  return (
    <section className="flex flex-col gap-3 rounded-xl border p-4">
      <h2 className="font-heading text-lg font-medium">Review this book</h2>
      <Label htmlFor="review-reason">Reason (shared with the author)</Label>
      <Textarea id="review-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} disabled={pending} />
      <div className="flex gap-2">
        <Button disabled={pending || !reason.trim()} onClick={() => decide("approve")}>Approve and publish</Button>
        <Button variant="destructive" disabled={pending || !reason.trim()} onClick={() => decide("reject")}>Request changes</Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
