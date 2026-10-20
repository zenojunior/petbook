import Image from "next/image";

// A drawn open book: the photo page on the left, the text page on the right.
// It shows what a Petbook looks like before anyone has written one.
export function BookPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="absolute inset-x-6 -bottom-3 h-6 rounded-[50%] bg-foreground/10 blur-md" />
      <div className="relative grid grid-cols-2 overflow-hidden rounded-2xl border bg-card shadow-[0_24px_60px_-28px_oklch(0.24_0.018_60/0.45)]">
        <div className="flex flex-col items-center justify-center gap-3 border-r bg-secondary/60 p-5">
          <div className="rounded-xl bg-card p-2 shadow-sm -rotate-2">
            <Image src="/logo.png" alt="" width={160} height={160} className="rounded-lg" priority />
          </div>
          <p className="font-heading text-sm italic text-muted-foreground">our first day home</p>
        </div>
        <div className="flex flex-col justify-between gap-6 p-5">
          <div className="space-y-3">
            <p className="text-[0.65rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Chapter one
            </p>
            <p className="font-heading text-lg leading-snug">She chose us on a rainy Tuesday.</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              She walked out of the carrier, inspected every corner, and fell asleep on the one chair
              nobody was allowed to sit on. It has been hers ever since.
            </p>
          </div>
          <p className="text-right font-heading text-xs text-muted-foreground">3</p>
        </div>
      </div>
    </div>
  );
}
