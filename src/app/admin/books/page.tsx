import Link from "next/link";
import { Suspense } from "react";
import { EmptyRow } from "@/components/admin/empty-row";
import { formatUsd } from "@/components/admin/moderation-usage";
import { Badge } from "@/components/ui/badge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { formatDate } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge, bookStatusLabel } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BOOK_STATUSES, listBooks, PAGE_SIZE, type BookStatus } from "@/lib/admin/data";
import { booksParams } from "@/lib/admin/params";
import { speciesLabel } from "@/lib/domain/species";
import { TableSkeleton } from "@/components/skeletons";

export default function BooksPage({ searchParams }: PageProps<"/admin/books">) {
  return (
    <>
      <PageHeader title="Books" description="Every book in any status, drafts included. Most recently updated first." />
      <Suspense fallback={<TableSkeleton />}>
        <Books searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Books({ searchParams }: Pick<PageProps<"/admin/books">, "searchParams">) {
  const { q, status, deleted, page } = booksParams.parse(await searchParams);
  const { rows, total } = await listBooks({ q, status, deleted, page });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusFilter label="All" href={filterHref(undefined, q, deleted)} active={!status} />
        {BOOK_STATUSES.map((s) => (
          <StatusFilter key={s} label={bookStatusLabel(s)} href={filterHref(s, q, deleted)} active={status === s} />
        ))}
      </div>

      <form className="flex max-w-xl flex-wrap gap-2" action="/admin/books">
        {status && <input type="hidden" name="status" value={status} />}
        <NativeSelect name="deleted" defaultValue={deleted} aria-label="Deleted books">
          <NativeSelectOption value="all">All records</NativeSelectOption>
          <NativeSelectOption value="active">Active books</NativeSelectOption>
          <NativeSelectOption value="deleted">Deleted books</NativeSelectOption>
        </NativeSelect>
        <Input name="q" defaultValue={q} placeholder="Search by title" aria-label="Search books" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Pet</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Known review cost</TableHead>
              <TableHead className="text-right">Pages</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <EmptyRow colSpan={8}>No books match these filters.</EmptyRow>}
            {rows.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <Link href={`/admin/books/${b.id}`} className="font-medium hover:underline">
                    {b.title}
                  </Link>
                </TableCell>
                <TableCell>
                  {b.petName} <span className="text-muted-foreground">({speciesLabel(b.species)})</span>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/users/${b.ownerId}`} className="hover:underline">
                    {b.ownerName}
                  </Link>
                </TableCell>
                <TableCell>{b.city ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                  {b.deletedAt && <Badge variant="destructive" className="ml-1">Deleted</Badge>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatUsd(b.estimatedCostUsd)}{b.unpricedReviews > 0 && <p className="text-xs text-muted-foreground">+ {b.unpricedReviews} unpriced</p>}</TableCell>
                <TableCell className="text-right tabular-nums">{b.pageCount}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatDate(b.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination pathname="/admin/books" params={{ q, status, deleted }} page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}

function filterHref(status: BookStatus | undefined, q: string | undefined, deleted: string) {
  const search = new URLSearchParams();
  if (status) search.set("status", status);
  if (q) search.set("q", q);
  if (deleted !== "all") search.set("deleted", deleted);
  const query = search.toString();
  return query ? `/admin/books?${query}` : "/admin/books";
}

function StatusFilter({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      nativeButton={false}
      render={<Link href={href} aria-current={active ? "page" : undefined} />}
    >
      {label}
    </Button>
  );
}
