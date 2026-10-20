"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { buildSpreads, spreadIndexOfSide } from "@/lib/domain/book-layout";
import { cn } from "@/lib/utils";
import { CoverSide, EndSide, PageSide, PlateSide } from "./book-sides";
import type { BookViewData } from "./types";

// Below this width (of the book's own container, not the screen) the book shows one page at a
// time; above it, an open book with two pages side by side.
const WIDE_MIN_PX = 560;

// A swipe shorter than this is a tap.
const SWIPE_MIN_PX = 40;

// Slow to start and to land, like a heavy page.
const TURN = { duration: 0.8, ease: [0.76, 0, 0.24, 1] } as const;

type Half = "left" | "right" | "full";

// Draws a pet's book: the cover, the inside of the cover, the pages as spreads, then "The end".
// Opened, the inside of the cover faces page 1, like a printed book. Turning a page
// flips a leaf around the spine; the closed book sits centered and slides over as it opens.
// Used as the live preview in the editor (re-rendered from unsaved form state) and by the reader.
export function BookView({
  book,
  focusPageIndex,
  className,
  activeSide,
  keyboardNavigation = "local",
  onSideChange,
  onSpreadChange,
}: {
  book: BookViewData;
  // Index into book.pages of the page being edited; when it changes, the book turns to it.
  // undefined = the cover.
  focusPageIndex?: number;
  className?: string;
  // Optional controlled navigation for the editor; readers retain local navigation.
  activeSide?: number;
  keyboardNavigation?: "local" | "document";
  onSideChange?: (side: number) => void;
  onSpreadChange?: (sides: number[]) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  // null until measured: the book stays hidden so it does not jump from one page to two.
  const measured = useIsWide(rootRef);
  const wide = measured ?? false;
  const reduceMotion = useReducedMotion() ?? false;

  const pageCount = book.pages.length;
  // buildSpreads counts the inside of the cover as one more page before the first.
  const spreads = buildSpreads(pageCount + 1, wide ? 2 : 1);

  // We remember sides (0 = cover, 1 = inside of the cover, page index + 2, pageCount + 2 = the
  // end) rather than spreads,
  // so the reader keeps their place when the layout switches between 1 and 2 pages.
  // `side` is where the book is going; `shownSide` is what lies flat while a leaf turns.
  const [localSide, setLocalSide] = useState(sideOfFocus(focusPageIndex));
  const side = activeSide ?? localSide;
  function setSide(nextSide: number) {
    setLocalSide(nextSide);
    onSideChange?.(nextSide);
  }
  const [shownSide, setShownSide] = useState(side);
  const [lastFocus, setLastFocus] = useState(focusPageIndex);
  if (focusPageIndex !== lastFocus) {
    setLastFocus(focusPageIndex);
    setLocalSide(sideOfFocus(focusPageIndex));
  }
  if (reduceMotion && shownSide !== side) setShownSide(side);

  const spreadIndex = spreadIndexOfSide(spreads, side);
  const visibleSidesKey = spreads[spreadIndex].join(",");
  useEffect(() => {
    onSpreadChange?.(visibleSidesKey.split(",").map(Number));
  }, [visibleSidesKey, onSpreadChange]);

  const shownIndex = spreadIndexOfSide(spreads, shownSide);
  const turning = spreadIndex !== shownIndex;
  const forward = spreadIndex > shownIndex;
  const canGoBack = spreadIndex > 0;
  const canGoForward = spreadIndex < spreads.length - 1;

  function turnTo(index: number) {
    setSide(spreads[index][0]);
  }
  const back = () => canGoBack && turnTo(spreadIndex - 1);
  const next = () => canGoForward && turnTo(spreadIndex + 1);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement> | globalThis.KeyboardEvent) {
    if (event.defaultPrevented) return;
    const element = event.target as HTMLElement;
    if (element.closest("input, textarea, select, [contenteditable=true], [role=combobox], [role=radio], [role=dialog], [role=menu], [role=listbox]")) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft" && canGoBack) {
      event.preventDefault();
      back();
    } else if (event.key === "ArrowRight" && canGoForward) {
      event.preventDefault();
      next();
    }
  }

  useEffect(() => {
    if (keyboardNavigation !== "document") return;
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  // Like a real book: tap the right page to go on, the left one to go back. A closed book
  // (only a cover, or only the last page) turns the only way it can.
  const target = halvesOf(spreads[spreadIndex], wide);
  const swipeStart = useRef<number | null>(null);
  const swiped = useRef(false);
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    swipeStart.current = event.clientX;
    swiped.current = false;
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (swipeStart.current === null) return;
    const dx = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) < SWIPE_MIN_PX) return;
    swiped.current = true;
    if (dx < 0) next();
    else back();
  }
  function onClick(event: MouseEvent<HTMLDivElement>) {
    if (swiped.current) return;
    if (target.left === null) return void next();
    if (target.right === null) return void back();
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX - rect.left >= rect.width / 2) next();
    else back();
  }

  function renderSide(sideNumber: number | null, half: Half): ReactNode {
    if (sideNumber === null) return null;
    if (sideNumber === 0) return <CoverSide book={book} />;
    if (sideNumber === 1) return <PlateSide book={book} />;
    if (sideNumber === pageCount + 2) {
      return <EndSide petName={book.pet.name} passed={book.pet.passedOn !== null} />;
    }
    return (
      <PageSide
        page={book.pages[sideNumber - 2]}
        number={sideNumber - 1}
        petName={book.pet.name}
        align={half === "full" ? "center" : half}
      />
    );
  }

  // What lies flat under a turning leaf: on the side the leaf leaves from, the spread we are
  // leaving; on the side it lands on, the spread we are going to (the leaf covers it until the end).
  const shown = halvesOf(spreads[shownIndex], wide);
  const under = !turning
    ? target
    : forward
      ? { left: shown.left, right: target.right }
      : { left: target.left, right: shown.right };

  // One page at a time: going forward the next page waits under the leaf; going back the leaf
  // brings the previous page down over the current one.
  const singleUnder = turning && forward ? target.right : shown.right;

  // The closed book (cover alone) and the last page alone are centered.
  const offset = wide && target.left === null ? "-25%" : wide && target.right === null ? "25%" : "0%";
  const title = book.title || "Untitled book";

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="book"
      aria-label={title}
      tabIndex={0}
      onKeyDown={keyboardNavigation === "local" ? onKeyDown : undefined}
      className={cn(
        "flex w-full flex-col gap-4 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <div
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className={cn(
          "relative w-full cursor-pointer touch-pan-y select-none",
          measured === null && "invisible",
          wide ? "aspect-[3/2]" : "aspect-[3/4]",
        )}
      >
        <motion.div
          // A new element when the layout switches between one and two pages, so the book
          // takes its place at once instead of sliding there.
          key={String(wide)}
          className="absolute inset-0"
          style={{ perspective: "2400px" }}
          initial={false}
          animate={{ x: offset }}
          transition={reduceMotion ? { duration: 0 } : TURN}
        >
          {wide ? (
            <>
              {under.left !== null && (
                <Paper side={under.left} half="left">
                  {renderSide(under.left, "left")}
                </Paper>
              )}
              {under.right !== null && (
                <Paper side={under.right} half="right">
                  {renderSide(under.right, "right")}
                </Paper>
              )}
            </>
          ) : (
            <Paper side={singleUnder} half="full">
              {renderSide(singleUnder, "full")}
            </Paper>
          )}

          {turning && (
            <Leaf
              key={`${shownIndex}-${spreadIndex}-${wide}`}
              wide={wide}
              forward={forward}
              front={wide ? (forward ? shown.right : shown.left) : forward ? shown.right : target.right}
              back={wide ? (forward ? target.left : target.right) : null}
              renderSide={renderSide}
              onDone={() => setShownSide(side)}
            />
          )}
        </motion.div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={!canGoBack} onClick={back}>
          <ChevronLeft />
        </Button>
        <p aria-live="polite" className="text-xs text-muted-foreground tabular-nums">
          {spreadLabel(spreads[spreadIndex], pageCount)}
        </p>
        <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={!canGoForward} onClick={next}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

// A sheet of the book lying in one half (or filling a one-page book). The cover is a hardcover:
// a square spine edge and its own color; pages are paper with a shadow toward the spine.
function Paper({
  side,
  half,
  className,
  style,
  children,
}: {
  side: number | null;
  half: Half;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      style={style}
      className={cn(
        "absolute inset-y-0 overflow-hidden border bg-card shadow-[0_24px_60px_-28px_oklch(0.24_0.018_60/0.45)]",
        half === "left" && "left-0 w-1/2 rounded-l-2xl rounded-r-sm",
        half === "right" && "right-0 w-1/2 rounded-l-sm rounded-r-2xl",
        half === "full" && "inset-x-0 rounded-2xl",
        isBoard(side) ? "border-transparent" : pageEdges(half),
        className,
      )}
    >
      {children}
      {/* The fold: pages darken a little toward the spine; the cover gets a hinge line. */}
      {half !== "full" && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 w-8 from-foreground/8 to-transparent",
            half === "left" ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r",
            isBoard(side) && "w-3 from-black/20",
          )}
        />
      )}
    </div>
  );
}

// The cover and its inside are the hard board; everything else is paper.
function isBoard(side: number | null): boolean {
  return side === 0 || side === 1;
}

// The edges of the pages under the top one, peeking out on the outer side.
function pageEdges(half: Half): string {
  if (half === "left") {
    return "shadow-[-1px_1px_0_var(--border),-2px_2px_0_var(--card),-3px_3px_0_var(--border),0_24px_60px_-28px_oklch(0.24_0.018_60/0.45)]";
  }
  return "shadow-[1px_1px_0_var(--border),2px_2px_0_var(--card),3px_3px_0_var(--border),0_24px_60px_-28px_oklch(0.24_0.018_60/0.45)]";
}

// The page in the middle of turning. Going forward it lifts off the right half and lands on the
// left; going back, the reverse. On a one-page book it lifts off to the left like a notepad.
function Leaf({
  wide,
  forward,
  front,
  back,
  renderSide,
  onDone,
}: {
  wide: boolean;
  forward: boolean;
  front: number | null;
  back: number | null;
  renderSide: (side: number | null, half: Half) => ReactNode;
  onDone: () => void;
}) {
  const from = wide ? 0 : forward ? 0 : -180;
  const to = wide ? (forward ? -180 : 180) : forward ? -180 : 0;
  const frontHalf: Half = !wide ? "full" : forward ? "right" : "left";
  const backHalf: Half = forward ? "left" : "right";

  return (
    <motion.div
      aria-hidden
      className={cn(
        "absolute inset-y-0 z-10 transform-3d",
        !wide ? "inset-x-0 origin-left" : forward ? "right-0 w-1/2 origin-left" : "left-0 w-1/2 origin-right",
      )}
      initial={{ rotateY: from }}
      animate={{ rotateY: to }}
      transition={TURN}
      onAnimationComplete={onDone}
    >
      <Paper side={front} half={frontHalf} className="inset-x-0 w-full backface-hidden">
        {renderSide(front, frontHalf)}
      </Paper>
      {wide && (
        <Paper
          side={back}
          half={backHalf}
          className="inset-x-0 w-full backface-hidden"
          style={{ transform: "rotateY(180deg)" }}
        >
          {renderSide(back, backHalf)}
        </Paper>
      )}
    </motion.div>
  );
}

// Which side lies in each half for a spread. Open book: the cover sits on the right with nothing
// on its left; a last page alone sits on the left. One-page book: everything is "right".
function halvesOf(spread: number[], wide: boolean): { left: number | null; right: number | null } {
  if (!wide) return { left: null, right: spread[0] };
  if (spread[0] === 0) return { left: null, right: 0 };
  return { left: spread[0], right: spread[1] ?? null };
}

function sideOfFocus(focusPageIndex: number | undefined): number {
  return focusPageIndex === undefined ? 0 : focusPageIndex + 2;
}

// "Cover", "Page 3 of 8", "Pages 3–4 of 8" or "The end". Takes sides, prints page numbers.
function spreadLabel(spread: number[], pageCount: number): string {
  const pages = spread.filter((side) => side >= 2 && side <= pageCount + 1).map((side) => side - 1);
  if (pages.length === 0) {
    if (spread[0] === 0) return "Cover";
    return spread[0] === 1 ? "Inside cover" : "The end";
  }
  if (pages.length === 1) return `Page ${pages[0]} of ${pageCount}`;
  return `Pages ${pages[0]}–${pages[1]} of ${pageCount}`;
}

// Whether the element is wide enough for an open book. It measures the element itself, so the
// book behaves the same in the editor's side column and in a full-width reader.
function useIsWide(ref: RefObject<HTMLDivElement | null>): boolean | null {
  const [wide, setWide] = useState<boolean | null>(null);
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
