"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBook } from "@/app/(app)/dashboard/publication-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function DeleteBookButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Delete book</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this book?</DialogTitle>
          <DialogDescription>It will disappear from your books and the map. Public and shared links will stop working. Administrators retain a record of the book and its reviews.</DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button variant="destructive" disabled={pending} onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const result = await deleteBook(bookId);
              if (!result.ok) setError(result.error);
              else { router.replace("/dashboard"); router.refresh(); }
            } catch { setError("Could not delete the book. Refresh and try again."); }
          });
        }}>{pending ? "Deleting…" : "Delete book"}</Button>
      </DialogContent>
    </Dialog>
  );
}
