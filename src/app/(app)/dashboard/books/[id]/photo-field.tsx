"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadPhoto } from "@/lib/books/upload-photo";

// Picks a photo, uploads it right away and hands back its URL. The book itself is saved by
// the editor's autosave, like any other change.
export function PhotoField({
  bookId,
  url,
  label,
  onChange,
}: {
  bookId: string;
  url: string | null;
  // Read by screen readers, e.g. "Photo for page 2" or "Cover photo".
  label: string;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const result = await uploadPhoto(bookId, file);
    setUploading(false);
    if (result.ok) onChange(result.url);
    else setError(result.error);
    // Allow picking the same file again after an error.
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-lg border border-dashed p-2">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary text-muted-foreground">
          {uploading ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element -- served by our own route, already resized.
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-5" aria-hidden />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            aria-label={url ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : url ? "Replace" : "Upload photo"}
          </Button>
          {url && !uploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Remove ${label.toLowerCase()}`}
              onClick={() => onChange(null)}
            >
              <Trash2 data-icon="inline-start" />
              Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label={label}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
