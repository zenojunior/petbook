"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildSpreads, spreadIndexOfSide } from "@/lib/domain/book-layout";
import { cn } from "@/lib/utils";
import { CoverSide, EndSide, PageSide } from "./book-sides";
import type { BookViewData } from "./types";

// Below this width (of the book's own container, not the screen) the book shows one page at a
// time; above it, an open book with two pages side by side.
const WIDE_MIN_PX = 560;

// Draws a pet's book: the cover, then the pages as spreads, then "The end". Used as the live
// preview in the editor (re-rendered from unsaved form state) and by the public reader.
export function BookView({
  book,
  focusPageIndex,
  className,
}: {
  book: BookViewData;
  // Index into book.pages of the page being edited; when it changes, the book turns to it.
  // undefined = the cover.
  focusPageIndex?: number;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wide = useIsWide(rootRef);

  const pageCount = book.pages.length;
  const spreads = buildSpreads(pageCount, wide ? 2 : 1);

  // We remember the side being read (0 = cover, page index + 1, pageCount + 1 = the end) rather
  // than the spread, so the reader keeps their place when the layout switches between 1 and 2.
  const [side, setSide] = useState(sideOfFocus(focusPageIndex));
  const [lastFocus, setLastFocus] = useState(focusPageIndex);
  if (focusPageIndex !== lastFocus) {
    setLastFocus(focusPageIndex);
    setSide(sideOfFocus(focusPageIndex));
  }

  const spreadIndex = spreadIndexOfSide(spreads, side);
  const spread = spreads[spreadIndex];
  const canGoBack = spreadIndex > 0;
  const canGoForward = spreadIndex < spreads.length - 1;

  function turnTo(index: number) {
    setSide(spreads[index][0]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft" && canGoBack) {
      event.preventDefault();
      turnTo(spreadIndex - 1);
    } else if (event.key === "ArrowRight" && canGoForward) {
      event.preventDefault();
      turnTo(spreadIndex + 1);
    }
  }

  const title = book.title || "Untitled book";
  const isPair = spread.length === 2;

  function renderSide(sideNumber: number, position: "left" | "right" | "single") {
    if (sideNumber === 0) return <CoverSide book={book} />;
    if (sideNumber === pageCount + 1) {
      return <EndSide petName={book.pet.name} passed={book.pet.passedOn !== null} />;
    }
    return (
      <PageSide
        page={book.pages[sideNumber - 1]}
        number={sideNumber}
        petName={book.pet.name}
        align={position === "single" ? "center" : position}
      />
    );
  }

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="book"
      aria-label={title}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        "flex w-full flex-col gap-4 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <div className={cn("relative w-full", wide ? "aspect-[3/2]" : "aspect-[3/4]")}>
        <div
          className={cn(
            "absolute inset-x-6 -bottom-3 h-6 rounded-[50%] bg-foreground/10 blur-md",
            // Under the closed book only, which sits in the right half.
            wide && spread[0] === 0 && "left-[calc(50%+1.5rem)]",
          )}
        />
        <div className={cn("absolute inset-0 grid", wide && "grid-cols-2")}>
          <div
            // A new key per spread replays the fade, which is how the page turns.
            key={spreadIndex}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-card shadow-[0_24px_60px_-28px_oklch(0.24_0.018_60/0.45)] animate-in fade-in-0 duration-300 motion-reduce:animate-none",
              isPair && "col-span-2 grid grid-cols-2",
              // A closed book: the cover sits on the right, the back cover on the left.
              wide && spread[0] === 0 && "col-start-2",
            )}
          >
            {isPair ? (
              <>
                <div className="relative min-h-0 border-r">
                  {renderSide(spread[0], "left")}
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-foreground/5 to-transparent" />
                </div>
                <div className="min-h-0">{renderSide(spread[1], "right")}</div>
              </>
            ) : (
              renderSide(spread[0], wide && spread[0] !== 0 ? "left" : "single")
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={!canGoBack}
          onClick={() => turnTo(spreadIndex - 1)}
        >
          <ChevronLeft />
        </Button>
        <p aria-live="polite" className="text-xs text-muted-foreground tabular-nums">
          {spreadLabel(spread, pageCount)}
        </p>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={!canGoForward}
          onClick={() => turnTo(spreadIndex + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function sideOfFocus(focusPageIndex: number | undefined): number {
  return focusPageIndex === undefined ? 0 : focusPageIndex + 1;
}

// "Cover", "Page 3 of 8", "Pages 3–4 of 8" or "The end".
function spreadLabel(spread: number[], pageCount: number): string {
  const pages = spread.filter((side) => side >= 1 && side <= pageCount);
  if (pages.length === 0) return spread[0] === 0 ? "Cover" : "The end";
  if (pages.length === 1) return `Page ${pages[0]} of ${pageCount}`;
  return `Pages ${pages[0]}–${pages[1]} of ${pageCount}`;
}

// Whether the element is wide enough for an open book. It measures the element itself, so the
// book behaves the same in the editor's side column and in a full-width reader.
function useIsWide(ref: RefObject<HTMLDivElement | null>): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWide(entry.contentRect.width >= WIDE_MIN_PX);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return wide;
}
