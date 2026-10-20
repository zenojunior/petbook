import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyRow } from "@/components/admin/empty-row";
import { Field } from "@/components/admin/field";
import { formatBytes, formatDate, formatDateTime } from "@/components/admin/format";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUser } from "@/lib/admin/data";

export default function UserPage({ params }: PageProps<"/admin/users/[id]">) {
  return (
    <>
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/users" />}>
          <ArrowLeft data-icon="inline-start" />
          All users
        </Button>
      </div>
      <Suspense fallback={null}>
        <UserDetail params={params} />
      </Suspense>
    </>
  );
}

async function UserDetail({ params }: Pick<PageProps<"/admin/users/[id]">, "params">) {
  const { id } = await params;
  const data = await getUser(id);
  if (!data) notFound();
  const { profile } = data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={profile.name} description={profile.email}>
        <div className="flex gap-1">
          <Badge variant={profile.role === "admin" ? "default" : "outline"}>
            {profile.role === "admin" ? "Admin" : "User"}
          </Badge>
          {profile.banned && <Badge variant="destructive">Banned</Badge>}
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Joined" value={formatDateTime(profile.createdAt)} />
            <Field label="Last active" value={formatDateTime(data.lastSeenAt)} />
            <Field label="Sessions" value={String(data.sessionCount)} />
            <Field label="Signs in with" value={data.providers.join(", ") || "—"} />
            <Field label="Email verified" value={profile.emailVerified ? "Yes" : "No"} />
            <Field
              label="Uploaded images"
              value={`${data.storage.files} file${data.storage.files === 1 ? "" : "s"}, ${formatBytes(data.storage.bytes)}`}
            />
            {profile.banned && (
              <Field
                label="Ban"
                value={`${profile.banReason ?? "No reason given"}${
                  profile.banExpires ? ` (until ${formatDate(profile.banExpires)})` : ""
                }`}
              />
            )}
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Pets and books</h2>
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pet</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Book</TableHead>
                <TableHead className="text-right">Images</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pets.length === 0 && <EmptyRow colSpan={6}>This user has not added a pet yet.</EmptyRow>}
              {data.pets.map((pet) => (
                <TableRow key={pet.id}>
                  <TableCell>
                    <span className="font-medium">{pet.name}</span>{" "}
                    <span className="text-muted-foreground">({pet.species})</span>
                  </TableCell>
                  <TableCell>{pet.city ?? "—"}</TableCell>
                  <TableCell>
                    {pet.bookId && pet.bookStatus ? (
                      <Link href={`/admin/books/${pet.bookId}`} className="flex items-center gap-2 hover:underline">
                        {pet.bookTitle}
                        <StatusBadge status={pet.bookStatus} />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">No book</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{pet.usage?.files ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{pet.usage ? formatBytes(pet.usage.bytes) : "—"}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatDate(pet.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
