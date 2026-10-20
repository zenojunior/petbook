import Link from "next/link";
import { Suspense } from "react";
import { formatDate } from "@/components/admin/format";
import { ModerationUsageCard } from "@/components/admin/moderation-usage";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge, bookStatusLabel } from "@/components/admin/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverview, BOOK_STATUSES } from "@/lib/admin/data";
import { StatsSkeleton } from "@/components/skeletons";

export default function AdminPage() {
  return (
    <>
      <PageHeader title="Overview" description="What is happening on Petbook right now." />
      <Suspense fallback={<StatsSkeleton />}>
        <Overview />
      </Suspense>
    </>
  );
}

// getOverview() calls requireAdmin(), so none of this is prerendered or sent to non-admins.
async function Overview() {
  const data = await getOverview();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={data.users} hint={`${data.admins} admin${data.admins === 1 ? "" : "s"}`} />
        <Stat label="New this week" value={data.newUsersThisWeek} hint="Sign-ups in the last 7 days" />
        <Stat label="Books" value={data.books} hint={`${data.pets} pets · ${data.deletedBooks} deleted books retained`} />
        <Stat
          label="Waiting for review"
          value={data.statusCounts.needs_human + data.statusCounts.in_review}
          hint="Books sent to the admin queue"
          href="/admin/reviews"
        />
      </div>

      <ModerationUsageCard usage={data.usage} />
      <Card>
        <CardHeader>
          <CardTitle>Books by status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {BOOK_STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/books?status=${status}`}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted"
            >
              <StatusBadge status={status} />
              <span className="tabular-nums">{data.statusCounts[status]}</span>
              <span className="sr-only">{bookStatusLabel(status)} books</span>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest sign-ups</CardTitle>
            <CardDescription>The five newest accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentUsers.length === 0 ? (
              <p className="text-muted-foreground">No one has signed up yet.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {data.recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-4 py-2">
                    <Link href={`/admin/users/${u.id}`} className="min-w-0 hover:underline">
                      <div className="truncate font-medium">{u.name}</div>
                      <div className="truncate text-muted-foreground">{u.email}</div>
                    </Link>
                    <span className="shrink-0 text-muted-foreground">{formatDate(u.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently updated books</CardTitle>
            <CardDescription>Any status, drafts included.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentBooks.length === 0 ? (
              <p className="text-muted-foreground">No books yet.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {data.recentBooks.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-4 py-2">
                    <Link href={`/admin/books/${b.id}`} className="min-w-0 hover:underline">
                      <div className="truncate font-medium">{b.title}</div>
                      <div className="truncate text-muted-foreground">by {b.ownerName}</div>
                    </Link>
                    <StatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, href }: { label: string; value: number; hint: string; href?: string }) {
  const card = (
    <Card className={href ? "h-full hover:bg-muted/50" : "h-full"}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">{hint}</CardContent>
    </Card>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}
