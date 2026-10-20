import type { ReactNode } from "react";
import { ImageIcon, PawPrint } from "lucide-react";
import { petDatesLine } from "@/lib/domain/book-layout";
import { cn } from "@/lib/utils";
import { CoverSurface } from "./cover-surface";
import type { BookViewData, BookViewPage } from "./types";

// The faces of a book drawn by <BookView>: the cover, a page and "The end".
// Each side is its own size container, so text and padding scale with the page, not the screen.

// The container query units (cqw) inside refer to this wrapper, so it must not be the element
// that uses them.
function Side({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="@container size-full">
      <div className={cn("flex size-full flex-col p-[7cqw]", className)}>{children}</div>
    </div>
  );
}
const label = "text-[clamp(0.55rem,2.6cqw,0.7rem)] font-medium tracking-[0.2em] text-muted-foreground uppercase";
const bodyText = "text-[clamp(0.75rem,4.2cqw,1rem)] leading-relaxed";

function Photo({ url, alt, className }: { url: string | null; alt: string; className?: string }) {
  if (!url) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-secondary/60 text-muted-foreground",
          className,
        )}
      >
        <ImageIcon className="size-[clamp(1rem,9cqw,2rem)]" aria-hidden />
        <span className={label}>Photo</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- urls may be blob: previews or external hosts.
    <img src={url} alt={alt} className={cn("rounded-lg object-cover", className)} />
  );
}

export function CoverSide({ book }: { book: BookViewData }) {
  const { pet } = book;
  const dates = petDatesLine(pet);
  const faded = "text-(--cover-ink)/70";
  return (
    <CoverSurface color={book.coverColor} pattern={book.coverPattern} className="size-full">
      <Side className="items-center gap-[4cqw] text-center">
        <p className={cn(label, faded)}>A Petbook</p>
        <div className="min-h-0 w-4/5 flex-1 -rotate-2 rounded-xl bg-card p-[2.5cqw] shadow-md">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- urls may be blob: previews or external hosts.
            <img
              src={book.coverUrl}
              alt={pet.name || "Cover photo"}
              className="size-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center rounded-lg bg-secondary text-muted-foreground/70">
              <PawPrint className="size-[18cqw]" aria-hidden />
            </div>
          )}
        </div>
        <div className="w-full space-y-[1.5cqw]">
          <h2
            className={cn(
              "line-clamp-3 font-heading text-[clamp(1.1rem,8cqw,2rem)] leading-tight break-words",
              !book.title && "italic opacity-60",
            )}
          >
            {book.title || "Untitled book"}
          </h2>
          <p className={cn(bodyText, faded, "truncate")}>
            {[pet.name || "Your pet", pet.species].filter(Boolean).join(" · ")}
          </p>
          {(dates || pet.city) && (
            <p className={cn(label, faded, "truncate")}>
              {[dates, pet.city].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </Side>
    </CoverSurface>
  );
}

function PageText({ text, className }: { text: string | null; className?: string }) {
  return (
    <div
      className={cn(
        bodyText,
        "min-h-0 overflow-y-auto break-words whitespace-pre-line [scrollbar-width:thin]",
        !text?.trim() && "text-muted-foreground/60 italic",
        className,
      )}
    >
      {text?.trim() ? text : "Write something…"}
    </div>
  );
}

export function PageSide({
  page,
  number,
  petName,
  align,
}: {
  page: BookViewPage;
  // 1-based, printed in the footer.
  number: number;
  petName: string;
  // Footer number goes to the outer edge of the page, like in a printed book.
  align: "left" | "right" | "center";
}) {
  const alt = page.caption || petName || "Photo";
  return (
    <Side className="gap-[4cqw]">
      {page.layout === "text" && <PageText text={page.text} className="flex-1" />}

      {page.layout === "photo" && (
        <>
          <Photo url={page.imageUrl} alt={alt} className="min-h-0 w-full flex-1" />
          {page.caption && (
            <p className="line-clamp-2 text-center font-heading text-[clamp(0.75rem,4cqw,1rem)] italic text-muted-foreground">
              {page.caption}
            </p>
          )}
        </>
      )}

      {page.layout === "photo+text" && (
        <>
          <Photo url={page.imageUrl} alt={alt} className="h-1/2 w-full shrink-0" />
          <PageText text={page.text} className="flex-1" />
        </>
      )}

      <p
        className={cn(
          "font-heading text-[clamp(0.65rem,3cqw,0.8rem)] text-muted-foreground",
          align === "left" && "text-left",
          align === "right" && "text-right",
          align === "center" && "text-center",
        )}
      >
        {number}
      </p>
    </Side>
  );
}

export function EndSide({ petName, passed }: { petName: string; passed: boolean }) {
  return (
    <Side className="items-center justify-center gap-[3cqw] bg-secondary/60 text-center">
      <PawPrint className="size-[10cqw] text-muted-foreground/70" aria-hidden />
      <p className="font-heading text-[clamp(1rem,7cqw,1.75rem)]">The end</p>
      {petName && (
        <p className={cn(bodyText, "text-muted-foreground italic")}>
          {passed ? `Forever loved, ${petName}.` : `To be continued, ${petName}.`}
        </p>
      )}
    </Side>
  );
}
