import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Placeholders shown while a page's data loads. They mirror the final layout so nothing jumps.

function Loading({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function MapSkeleton({ className = "h-[min(68dvh,720px)] min-h-96" }: { className?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className={`w-full rounded-2xl ${className}`} />
    </div>
  );
}

export function ExploreSkeleton() {
  return <Loading label="Loading stories…"><MapSkeleton /></Loading>;
}

export function ReaderSkeleton() {
  return (
    <Loading label="Opening the book…" className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6">
      <Skeleton className="aspect-[3/2] w-full max-w-[min(64rem,calc((100dvh-15rem)*1.5))] rounded-2xl" />
      <Skeleton className="h-3 w-64" />
    </Loading>
  );
}

export function BookCardsSkeleton() {
  return (
    <Loading label="Loading your books…" className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2"><Skeleton className="h-9 w-48" /><Skeleton className="h-4 w-24" /></div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i}>
            <CardHeader className="grid-cols-[auto_minmax(0,1fr)] gap-x-4">
              <Skeleton className="row-span-2 h-16 w-12" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent><Skeleton className="h-3 w-40" /></CardContent>
          </Card>
        ))}
      </div>
    </Loading>
  );
}

export function FormCardSkeleton() {
  return (
    <Loading label="Loading…">
      <Card className="max-w-2xl">
        <CardHeader><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-56" /></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-28" />
        </CardContent>
      </Card>
    </Loading>
  );
}

export function EditorSkeleton() {
  return (
    <Loading label="Opening the editor…" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-8 w-32" /></div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-24 w-full" /></div>
        <Skeleton className="aspect-[3/2] w-full rounded-2xl" />
      </div>
    </Loading>
  );
}

export function SignInButtonSkeleton() {
  return <Skeleton className="h-8 w-full" role="status" aria-label="Loading" />;
}

export function StatsSkeleton() {
  return (
    <Loading label="Loading…" className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}><CardHeader><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-16" /></CardHeader></Card>
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-56 w-full rounded-xl" /><Skeleton className="h-56 w-full rounded-xl" /></div>
    </Loading>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Loading label="Loading…" className="flex flex-col gap-4">
      <div className="flex max-w-sm gap-2"><Skeleton className="h-8 flex-1" /><Skeleton className="h-8 w-20" /></div>
      <div className="divide-y rounded-xl border">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 p-3"><Skeleton className="size-6 rounded-full" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-20" /></div>
        ))}
      </div>
    </Loading>
  );
}

export function DetailSkeleton() {
  return (
    <Loading label="Loading…" className="flex flex-col gap-6">
      <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-40" /></div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-48 w-full rounded-xl" /></div>
    </Loading>
  );
}


// The landing page's book while it is chosen: same wash and size as the closed book, so the real
// one takes its place without the layout moving.
export function FeaturedBookSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex min-w-0 flex-col items-center gap-4 rounded-3xl bg-secondary/60 p-4 sm:p-8">
      <span className="sr-only">Loading a book…</span>
      <div className="flex w-full max-w-[40rem] items-center justify-center aspect-[3/4] sm:aspect-[3/2]">
        <Skeleton className="h-full w-full rounded-2xl sm:w-1/2" />
      </div>
      <div className="flex h-5 w-full max-w-[40rem] items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-44" />
      </div>
    </div>
  );
}
