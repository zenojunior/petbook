import Link from "next/link";
import { EmptyRow } from "@/components/admin/empty-row";
import { formatDateTime } from "@/components/admin/format";
import { DecisionBadge } from "@/components/admin/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Review = {
  id: string;
  bookId: string;
  bookTitle: string;
  source: "rules" | "ai" | "admin";
  decision: "approve" | "reject" | "needs_human";
  reasons: string[];
  reviewerName: string | null;
  createdAt: Date;
};

const sourceLabels: Record<Review["source"], string> = { rules: "Rules", ai: "AI", admin: "Admin" };

export function ReviewsTable({ reviews, showBook }: { reviews: Review[]; showBook: boolean }) {
  const columns = showBook ? 5 : 4;
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {showBook && <TableHead>Book</TableHead>}
            <TableHead>From</TableHead>
            <TableHead>Decision</TableHead>
            <TableHead>Reasons</TableHead>
            <TableHead className="text-right">When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.length === 0 && <EmptyRow colSpan={columns}>No reviews yet.</EmptyRow>}
          {reviews.map((r) => (
            <TableRow key={r.id}>
              {showBook && (
                <TableCell>
                  <Link href={`/admin/books/${r.bookId}`} className="font-medium hover:underline">
                    {r.bookTitle}
                  </Link>
                </TableCell>
              )}
              <TableCell>
                {sourceLabels[r.source]}
                {r.reviewerName && <span className="text-muted-foreground"> ({r.reviewerName})</span>}
              </TableCell>
              <TableCell>
                <DecisionBadge decision={r.decision} />
              </TableCell>
              <TableCell className="whitespace-normal">
                <Reasons reasons={r.reasons} />
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function Reasons({ reasons }: { reasons: string[] | null }) {
  if (!reasons?.length) return <span className="text-muted-foreground">—</span>;
  return (
    <ul className="list-disc pl-4">
      {reasons.map((reason, i) => (
        <li key={i}>{reason}</li>
      ))}
    </ul>
  );
}
