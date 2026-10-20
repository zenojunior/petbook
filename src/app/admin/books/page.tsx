import Link from "next/link";
import { Suspense } from "react";
import { EmptyRow } from "@/components/admin/empty-row";
import { formatDate } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { StatusBadge, bookStatusLabel } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BOOK_STATUSES, listBooks, PAGE_SIZE, type BookStatus } from "@/lib/admin/data";
import { booksParams } from "@/lib/admin/params";

export default function BooksPage({ searchParams }: PageProps<"/admin/books">) {
  return (
    <>
      <PageHeader title="Books" description="Every book in any status, drafts included. Most recently updated first." />
      <Suspense fallback={null}>
        <Books searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Books({ searchParams }: Pick<PageProps<"/admin/books">, "searchParams">) {
  const { q, status, page } = booksParams.parse(await searchParams);
  const { rows, total } = await listBooks({ q, status, page });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusFilter label="All" href={filterHref(undefined, q)} active={!status} />
        {BOOK_STATUSES.map((s) => (
          <StatusFilter key={s} label={bookStatusLabel(s)} href={filterHref(s, q)} active={status === s} />
        ))}
      </div>

      <form className="flex max-w-sm gap-2" action="/admin/books">
        {status && <input type="hidden" name="status" value={status} />}
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
              <TableHead className="text-right">Pages</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && <EmptyRow colSpan={7}>No books match these filters.</EmptyRow>}
            {rows.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <Link href={`/admin/books/${b.id}`} className="font-medium hover:underline">
                    {b.title}
                  </Link>
                </TableCell>
                <TableCell>
                  {b.petName} <span className="text-muted-foreground">({b.species})</span>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/users/${b.ownerId}`} className="hover:underline">
                    {b.ownerName}
                  </Link>
                </TableCell>
                <TableCell>{b.city}</TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{b.pageCount}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatDate(b.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination pathname="/admin/books" params={{ q, status }} page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}

function filterHref(status: BookStatus | undefined, q: string | undefined) {
  const search = new URLSearchParams();
  if (status) search.set("status", status);
  if (q) search.set("q", q);
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
