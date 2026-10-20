"use client";

import { Check, Copy, Globe, Link2, Lock, RotateCcw, Share2 } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { setShareLink } from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Visibility } from "@/lib/domain/book-access";
import { cn } from "@/lib/utils";

// Who can read the book: only the author, anyone with the secret link, or everyone (published
// after review). Publication is requested with the editor's Submit for review button.
export function ShareDialog({
  bookId,
  slug,
  published,
  initialToken,
}: {
  bookId: string;
  slug: string;
  published: boolean;
  initialToken: string | null;
}) {
  const [token, setToken] = useState(initialToken);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const visibility: Visibility = published ? "public" : token ? "link" : "private";

  function update(options: { enabled: boolean; reset?: boolean }) {
    setError(null);
    startTransition(async () => {
      const result = await setShareLink(bookId, options);
      if (result.ok) setToken(result.token);
      else setError(result.error);
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Share2 data-icon="inline-start" />
        Share
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this book</DialogTitle>
          <DialogDescription>Choose who can read it.</DialogDescription>
        </DialogHeader>

        <fieldset disabled={pending || published} className="flex flex-col gap-2">
          <legend className="sr-only">Visibility</legend>
          <Option
            icon={<Lock />}
            title="Private"
            description="Only you can see it."
            checked={visibility === "private"}
            onSelect={() => update({ enabled: false })}
          />
          <Option
            icon={<Link2 />}
            title="Anyone with the link"
            description="People you send the link to can read it, even while it is a draft. It is not listed on Petbook."
            checked={visibility === "link"}
            onSelect={() => update({ enabled: true })}
          />
          <Option
            icon={<Globe />}
            title="Public on Petbook"
            description="Everyone can find it on the map. Use Submit for review in the editor to make this book public after review."
            checked={visibility === "public"}
            disabled={!published}
            badge={published ? undefined : "Review required"}
            onSelect={() => {}}
          />
        </fieldset>

        {visibility === "link" && token && (
          <div className="flex flex-col gap-2">
            <CopyField url={sharedUrl(token)} />
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-muted-foreground"
              disabled={pending}
              onClick={() => update({ enabled: true, reset: true })}
            >
              <RotateCcw data-icon="inline-start" />
              Reset link (old links stop working)
            </Button>
          </div>
        )}
        {visibility === "public" && <CopyField url={absoluteUrl(`/b/${slug}`)} />}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}

function Option({
  icon,
  title,
  description,
  checked,
  disabled,
  badge,
  onSelect,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  badge?: string;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 [&_svg]:size-4",
        checked ? "border-foreground/40 bg-secondary/60" : "hover:bg-secondary/40",
        disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
      )}
    >
      <input
        type="radio"
        name="visibility"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          {title}
          {badge && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
              {badge}
            </span>
          )}
        </span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "mt-1 size-4 shrink-0 rounded-full border",
          checked && "border-[5px] border-foreground",
        )}
      />
    </label>
  );
}

function CopyField({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="flex gap-2">
      <Input readOnly value={url} aria-label="Link" onFocus={(e) => e.currentTarget.select()} />
      <Button variant="outline" onClick={copy} aria-label="Copy link">
        {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

function sharedUrl(token: string): string {
  return absoluteUrl(`/s/${token}`);
}

function absoluteUrl(path: string): string {
  return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
}
