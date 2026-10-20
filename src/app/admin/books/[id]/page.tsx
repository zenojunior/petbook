import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Field } from "@/components/admin/field";
import { formatBytes, formatDateTime, formatDay } from "@/components/admin/format";
import { ModerationHistory } from "@/components/admin/moderation-history";
import { PageHeader } from "@/components/admin/page-header";
import { ReviewControls } from "@/components/admin/review-controls";
import { BookView } from "@/components/book/book-view";
import { ReviewsTable } from "@/components/admin/reviews-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBook } from "@/lib/admin/data";
import { bookId } from "@/lib/admin/params";
import { speciesLabel } from "@/lib/domain/species";
import { DetailSkeleton } from "@/components/skeletons";

export default function BookPage({ params, searchParams }: PageProps<"/admin/books/[id]">) {
  return (
    <>
      <div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/admin/books" />}>
          <ArrowLeft data-icon="inline-start" />
          All books
        </Button>
      </div>
      <Suspense fallback={<DetailSkeleton />}>
        <BookDetail params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function BookDetail({ params, searchParams }: Pick<PageProps<"/admin/books/[id]">, "params" | "searchParams">) {
  const id = bookId.safeParse((await params).id);
  if (!id.success) notFound();
  const data = await getBook(id.data);
  if (!data) notFound();
  const { book, pet, owner } = data;
  const imageBytes = data.files.reduce((sum, f) => sum + f.bytes, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={book.title} description={`/${book.slug}`}>
        <StatusBadge status={book.status} />
        {book.deletedAt && <Badge variant="destructive">Deleted</Badge>}
      </PageHeader>

      {!book.deletedAt && (book.status === "needs_human" || book.status === "in_review") && <ReviewControls bookId={book.id} />}
      {book.deletedAt && <p className="rounded-lg border p-4 text-sm text-muted-foreground">Deleted by the author on {formatDateTime(book.deletedAt)}. Retained for administrators; public, shared and author access is disabled.</p>}
      <ModerationHistory bookId={book.id} searchParams={searchParams} />
      <section aria-label="Book preview" className="mx-auto w-full max-w-3xl"><BookView book={{ title: book.title, coverUrl: book.coverUrl, coverColor: book.coverColor, coverPattern: book.coverPattern,
        pet: { name: pet.name, species: speciesLabel(pet.species), city: pet.city, bornOn: pet.bornOn, adoptedOn: pet.adoptedOn, passedOn: pet.passedOn }, pages: data.pages }} /></section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Book</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field
                label="Author"
                value={
                  <Link href={`/admin/users/${owner.id}`} className="hover:underline">
                    {owner.name}
                  </Link>
                }
              />
              <Field label="Author email" value={owner.email} />
              <Field label="Created" value={formatDateTime(book.createdAt)} />
              <Field label="Updated" value={formatDateTime(book.updatedAt)} />
              <Field label="Published" value={formatDateTime(book.publishedAt)} />
              <Field label="Cover" value={book.coverUrl ? "Yes" : "Missing"} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pet</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <Field label="Name" value={pet.name} />
              <Field label="Species" value={speciesLabel(pet.species)} />
              <Field label="Born" value={formatDay(pet.bornOn)} />
              <Field label="Adopted" value={formatDay(pet.adoptedOn)} />
              <Field label="Passed away" value={formatDay(pet.passedOn)} />
              {/* Already rounded by fuzzLocation() when it was stored. */}
              <Field
                label="Location"
                value={
                  pet.city === null
                    ? "Not set"
                    : pet.lat === null || pet.lng === null
                      ? pet.city
                      : `${pet.city} (${pet.lat.toFixed(2)}, ${pet.lng.toFixed(2)})`
                }
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Pages ({data.pages.length})</h2>
        {data.pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">This book has no pages yet.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {data.pages.map((page) => (
              <li key={page.id}>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Page {page.position + 1}
                      <Badge variant="outline">{page.layout}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {page.imageUrl && (
                      <a href={page.imageUrl} target="_blank" rel="noreferrer" className="truncate underline">
                        {page.imageUrl}
                      </a>
                    )}
                    {page.caption && <p className="text-muted-foreground italic">{page.caption}</p>}
                    {page.text && <p className="whitespace-pre-wrap">{page.text}</p>}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-medium">
            Images ({data.files.length}, {formatBytes(imageBytes)})
          </h2>
          <p className="text-sm text-muted-foreground">
            Files in this book&apos;s upload folder, <code className="font-mono">uploads/books/{book.id}/</code>.
          </p>
        </div>
        {data.files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No images uploaded for this book.</p>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.files.map((file) => (
                  <TableRow key={file.name}>
                    <TableCell className="font-mono">{file.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBytes(file.bytes)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Review history</h2>
        <ReviewsTable reviews={data.reviews} showBook={false} />
      </section>
    </div>
  );
}
