import type { ReactNode } from "react";
import type { CoverColor, CoverPattern } from "@/lib/domain/book-cover";
import { cn } from "@/lib/utils";

// A surface painted like a book's cover: its color, its pattern, and text in the cover's ink.
// The colors and patterns are tokens in src/styles/tokens.app.css.
export function CoverSurface({
  color,
  pattern,
  className,
  children,
}: {
  color: CoverColor;
  pattern: CoverPattern;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-cover={color}
      data-cover-pattern={pattern}
      className={cn("relative isolate bg-(--cover) text-(--cover-ink)", className)}
    >
      {pattern !== "plain" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-(--cover-ink) opacity-[0.1] mask-(--cover-pattern) mask-size-(--cover-pattern-size)"
        />
      )}
      {children}
    </div>
  );
}
