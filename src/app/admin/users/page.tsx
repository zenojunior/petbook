import Link from "next/link";
import { Suspense } from "react";
import { EmptyRow } from "@/components/admin/empty-row";
import { formatDate } from "@/components/admin/format";
import { formatUsd } from "@/components/admin/moderation-usage";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listUsers, PAGE_SIZE } from "@/lib/admin/data";
import { usersParams } from "@/lib/admin/params";

export default function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <>
      <PageHeader title="Users" description="Everyone who has signed in, newest first." />
      <Suspense fallback={null}>
        <Users searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Users({ searchParams }: Pick<PageProps<"/admin/users">, "searchParams">) {
  const { q, page } = usersParams.parse(await searchParams);
  const { rows, total } = await listUsers({ q, page });

  return (
    <div className="flex flex-col gap-4">
      <form className="flex max-w-sm gap-2" action="/admin/users">
        <Input name="q" defaultValue={q} placeholder="Search by name or email" aria-label="Search users" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Books</TableHead>
              <TableHead className="text-right">Known review cost</TableHead>
              <TableHead className="text-right">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <EmptyRow colSpan={5}>{q ? `No users match "${q}".` : "No users yet."}</EmptyRow>
            )}
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 hover:underline">
                    <Avatar size="sm">
                      {u.image && <AvatarImage src={u.image} alt="" />}
                      <AvatarFallback>{u.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{u.name}</div>
                      <div className="truncate text-muted-foreground">{u.email}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Badge variant={u.role === "admin" ? "default" : "outline"}>
                      {u.role === "admin" ? "Admin" : "User"}
                    </Badge>
                    {u.banned && <Badge variant="destructive">Banned</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{u.bookCount}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUsd(u.estimatedCostUsd)}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination pathname="/admin/users" params={{ q }} page={page} pageSize={PAGE_SIZE} total={total} />
    </div>
  );
}
