import Link from "next/link";
import { Suspense } from "react";
import { EmptyRow } from "@/components/admin/empty-row";
import { formatDateTime } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/page-header";
import { Reasons, ReviewsTable } from "@/components/admin/reviews-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getReviewQueue } from "@/lib/admin/data";
import { TableSkeleton } from "@/components/skeletons";

export default function ReviewsPage() {
  return (
    <>
      <PageHeader
        title="Review queue"
        description="Books awaiting a decision, including interrupted automatic reviews. Oldest first."
      />
      <Suspense fallback={<TableSkeleton />}>
        <Reviews />
      </Suspense>
    </>
  );
}

async function Reviews() {
  const { queue, recent } = await getReviewQueue();

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Why it is here</TableHead>
              <TableHead className="text-right">Waiting since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.length === 0 && <EmptyRow colSpan={4}>Nothing to review. The queue is empty.</EmptyRow>}
            {queue.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <Link href={`/admin/books/${b.id}`} className="font-medium hover:underline">
                    {b.title}
                  </Link>
                  <div className="text-muted-foreground">{b.petName}</div>
                </TableCell>
                <TableCell>{b.ownerName}</TableCell>
                <TableCell className="whitespace-normal">
                  <Reasons reasons={b.reasons} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{formatDateTime(b.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Latest decisions</h2>
        <ReviewsTable reviews={recent} showBook />
      </section>
    </div>
  );
}
